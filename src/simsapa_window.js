import { app, shell, BrowserWindow } from 'electron';

const fs = require('fs');
const path = require('path');
const url = require('url');

const express = require('express');
const body_parser = require('body-parser');
const opn = require('opn');

const express_app = express();

const sequelize_module = require("sequelize");

const app_info = require('./app_info');
const version = require("./version");

export function create(mainWindow, dbPath) {

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: path.join(app_info.simsapaSrcPath, "icons", "logo-letter-w64.png")
    });

    const seq = new sequelize_module({
        dialect: "sqlite",

        define: {
            timestamps: false // true by default
        },

        //operatorsAliases: false,

        //pool: {
        //    max: 5,
        //    min: 0,
        //    acquire: 30000,
        //    idel: 10000
        //},

        storage: dbPath,
    });

    const db = require('./models');
    const Op = sequelize_module.Op;

    express_app.use(body_parser.json());
    express_app.use(express.static(path.join(app_info.simsapaAppDataPath, 'static')));

    express_app.get("/authors/:uid", (req, res) => {
        const author_uid = req.params.uid;

        return seq.query("SELECT * FROM authors WHERE uid = :uid;", {
            replacements: {
                uid: author_uid
            },
            type: seq.QueryTypes.SELECT,
            model: db.Author
        })
            .then((data) => res.send(data))

            .catch((err) => {
                console.log("There was an error querying authors", JSON.stringify(err));
                return res.send(err);
            });
    });

    express_app.get("/search/dict_words", (req, res) => {
        const query = req.query.query;

        let opts = {
            word_starts_with: true,
            word_contains: true,
            contains_exactly: true,
            fulltext: true,
        };

        if (req.query.word_starts_with === "false") {
            opts.word_starts_with = false;
        }
        if (req.query.word_contains === "false") {
            opts.word_contains = false;
        }
        if (req.query.contains_exactly === "false") {
            opts.contains_exactly = false;
        }
        if (req.query.fulltext === "false") {
            opts.fulltext = false;
        }

        let results = {
            word_starts_with: [],
            word_contains: [],
            contains_exactly: [],
            fulltext: [],
            total_count: 0,
        };

        let actions = [];

        // word starts with

        if (opts.word_starts_with) {
            const items_sql = `
SELECT * FROM dict_words
WHERE word LIKE :query
ORDER BY word ASC;
`;

            let p = seq.query(items_sql, {
                replacements: {
                    query: query + "%"
                },
                type: seq.QueryTypes.SELECT,
                model: db.DictWord
            })

                .then((data) => {
                    results
                        .word_starts_with
                        .push.apply(results
                                    .word_starts_with,
                                    data);

                    results.total_count += data.length;
                })

                .catch((err) => {
                    console.log("There was an error querying dict_words", JSON.stringify(err));
                    return res.send(err);
                });

            actions.push(p);
        }

        // word contains

        if (opts.word_contains) {
            const items_sql = `
SELECT * FROM dict_words
WHERE word LIKE :query
ORDER BY word ASC;
`;

            let p = seq.query(items_sql, {
                replacements: {
                    query: "%" + query + "%"
                },
                type: seq.QueryTypes.SELECT,
                model: db.DictWord
            })

                .then((data) => {
                    results
                        .word_contains
                        .push.apply(results
                                    .word_contains,
                                    data);

                    results.total_count += data.length;
                })

                .catch((err) => {
                    console.log("There was an error querying dict_words", JSON.stringify(err));
                    return res.send(err);
                });

            actions.push(p);
        }

        // contains exactly

        if (opts.contains_exactly) {
            const items_sql = `
SELECT * FROM dict_words
WHERE definition_plain LIKE :query
ORDER BY word ASC;
`;

            let p = seq.query(items_sql, {
                replacements: {
                    query: "%" + query + "%"
                },
                type: seq.QueryTypes.SELECT,
                model: db.DictWord
            })

                .then((data) => {
                    results
                        .contains_exactly
                        .push.apply(results
                                    .contains_exactly,
                                    data);

                    results.total_count += data.length;
                })

                .catch((err) => {
                    console.log("There was an error querying dict_words", JSON.stringify(err));
                    return res.send(err);
                });

            actions.push(p);
        }

        // fulltext search

        if (opts.fulltext) {
                const items_sql = `
SELECT
    dict_words.id,
    dict_words.word,
    snippet(fts_dict_words, 1, '<b class="highlight">', '</b>', ' ... ', 64) AS definition_plain,
    dict_words.definition_html,
    dict_words.summary,
    dict_words.grammar,
    dict_words.entry_source,
    dict_words.from_lang,
    dict_words.to_lang
FROM fts_dict_words
INNER JOIN dict_words ON dict_words.id = fts_dict_words.rowid
WHERE fts_dict_words MATCH :query
ORDER BY rank;
`;

                let p = seq.query(items_sql, {
                    replacements: {
                        query: escape_string_for_fts(query) + "*"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.DictWord
                })

                    .then((data) => {
                        results
                            .fulltext
                            .push.apply(results
                                        .fulltext,
                                        data);

                        results.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying fts_dict_words", JSON.stringify(err));
                        return res.send(err);
                    });

            actions.push(p);
        }

        Promise.all(actions)
            .then(() => {
                return res.send(results);
            })
            .catch((err) => {
                res.send(err);
            });

    });

    express_app.get("/search/texts", (req, res) => {
        const query = req.query.query;

        let opts = {
            root_texts: true,
            translated_texts: true,
            acronym_contains: true,
            title_contains: true,
            fulltext: true,
            contains_exactly: true,
        };

        if (req.query.root_texts === "false") {
            opts.root_texts = false;
        }
        if (req.query.translated_texts === "false") {
            opts.translated_texts = false;
        }
        if (req.query.acronym_contains === "false") {
            opts.acronym_contains = false;
        }
        if (req.query.title_contains === "false") {
            opts.title_contains = false;
        }
        if (req.query.fulltext === "false") {
            opts.fulltext = false;
        }
        if (req.query.contains_exactly === "false") {
            opts.contains_exactly = false;
        }

        let results = {
            root_texts: {
                acronym_contains: [],
                title_contains: [],
                contains_exactly: [],
                fulltext: [],
                total_count: 0,
            },
            translated_texts: {
                acronym_contains: [],
                title_contains: [],
                contains_exactly: [],
                fulltext: [],
                total_count: 0,
            },
        };

        let actions = [];

        if (opts.root_texts) {

            // root_texts.acronym contains

            if (opts.acronym_contains) {
                const items_sql = `
SELECT root_texts.*
FROM root_texts
WHERE acronym LIKE :q_acronym
ORDER BY acronym ASC;
`;
                let p = seq.query(items_sql, {
                    replacements: {
                        q_acronym: "%" + query + "%",
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.RootText
                })

                    .then((data) => {
                        results
                            .root_texts
                            .acronym_contains
                            .push.apply(results
                                        .root_texts
                                        .acronym_contains,
                                        data);

                        results.root_texts.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying root_texts", JSON.stringify(err));
                        return res.send(err);
                    });

                actions.push(p);
            }

            // root_text.title contains

            if (opts.title_contains) {
                const items_sql = `
SELECT root_texts.*
FROM root_texts
WHERE title LIKE :q_title
ORDER BY title ASC;
`;
                let p = seq.query(items_sql, {
                    replacements: {
                        q_title: "%" + query + "%",
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.RootText
                })

                    .then((data) => {
                        results
                            .root_texts
                            .title_contains
                            .push.apply(results
                                        .root_texts
                                        .title_contains,
                                        data);

                        results.root_texts.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying root_texts", JSON.stringify(err));
                        return res.send(err);
                    });

                actions.push(p);
            }

            // fts_root_texts.content_plain contains exactly

            if (opts.contains_exactly) {
                const items_sql = `
SELECT root_texts.*
FROM root_texts
WHERE content_plain LIKE :search_content
ORDER BY title ASC;
`;
                let p = seq.query(items_sql, {
                    replacements: {
                        search_content: "%" + query + "%",
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.RootText
                })

                    .then((data) => {
                        results
                            .root_texts
                            .contains_exactly
                            .push.apply(results
                                        .root_texts
                                        .contains_exactly,
                                        data);

                        results.root_texts.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying root_texts", JSON.stringify(err));
                        return res.send(err);
                    });

                actions.push(p);
            }

            // fts_root_texts.content_plain fulltext

            if (opts.fulltext) {
                const items_sql = `
SELECT
    root_texts.id,
    root_texts.uid,
    root_texts.author_uid,
    root_texts.acronym,
    root_texts.volpage,
    root_texts.title,
    root_texts.content_language,
    snippet(fts_root_texts, 0, '<b class="highlight">', '</b>', ' ... ', 64) AS content_plain,
    root_texts.content_html
FROM fts_root_texts
INNER JOIN root_texts ON root_texts.id = fts_root_texts.rowid
WHERE fts_root_texts MATCH :search_content
ORDER BY rank;
`;

                let p = seq.query(items_sql, {
                    replacements: {
                        search_content: escape_string_for_fts(query) + "*"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.RootText
                })

                    .then((data) => {
                        results
                            .root_texts
                            .fulltext
                            .push.apply(results
                                        .root_texts
                                        .fulltext,
                                        data);

                        results.root_texts.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying fts_root_texts", JSON.stringify(err));
                        return res.send(err);
                    });

                actions.push(p);
            }

        }

        if (opts.translated_texts) {

            // translated_texts.acronym contains

            if (opts.acronym_contains) {
                const items_sql = `
SELECT translated_texts.*
FROM translated_texts
WHERE acronym LIKE :q_acronym
ORDER BY acronym ASC;
`;

                let p = seq.query(items_sql, {
                    replacements: {
                        q_acronym: "%" + query + "%",
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.TranslatedText
                })

                    .then((data) => {
                        results
                            .translated_texts
                            .acronym_contains
                            .push.apply(results
                                        .translated_texts
                                        .acronym_contains,
                                        data);

                        results.translated_texts.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying translated_texts", JSON.stringify(err));
                        return res.send(err);
                    });

                actions.push(p);
            }

            // translated_text.title contains

            if (opts.title_contains) {
                const items_sql = `
SELECT translated_texts.*
FROM translated_texts
WHERE title LIKE :q_title
ORDER BY title ASC;
`;

                let p = seq.query(items_sql, {
                    replacements: {
                        q_title: "%" + query + "%"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.TranslatedText
                })

                    .then((data) => {
                        results
                            .translated_texts
                            .title_contains
                            .push.apply(results
                                        .translated_texts
                                        .title_contains,
                                        data);

                        results.translated_texts.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying translated_texts", JSON.stringify(err));
                        return res.send(err);
                    });

                actions.push(p);
            }

            // translated_text.content_plain contains exactly

            if (opts.contains_exactly) {
                const items_sql = `
SELECT translated_texts.*
FROM translated_texts
WHERE content_plain LIKE :search_content
ORDER BY title ASC;
`;

                let p = seq.query(items_sql, {
                    replacements: {
                        search_content: "%" + query + "%"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.TranslatedText
                })

                    .then((data) => {
                        results
                            .translated_texts
                            .contains_exactly
                            .push.apply(results
                                        .translated_texts
                                        .contains_exactly,
                                        data);

                        results.translated_texts.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying translated_texts", JSON.stringify(err));
                        return res.send(err);
                    });

                actions.push(p);
            }

            // fts_translated_texts.content_plain fulltext

            if (opts.fulltext) {
                const items_sql = `
SELECT
    translated_texts.id,
    translated_texts.uid,
    translated_texts.author_uid,
    translated_texts.acronym,
    translated_texts.volpage,
    translated_texts.title,
    translated_texts.root_title,
    translated_texts.content_language,
    snippet(fts_translated_texts, 0, '<b class="highlight">', '</b>', ' ... ', 64) AS content_plain,
    translated_texts.content_html
FROM fts_translated_texts
INNER JOIN translated_texts ON translated_texts.id = fts_translated_texts.rowid
WHERE fts_translated_texts MATCH :search_content
ORDER BY rank;
`;

                let p = seq.query(items_sql, {
                    replacements: {
                        search_content: escape_string_for_fts(query) + "*"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.TranslatedText
                })

                    .then((data) => {
                        results
                            .translated_texts
                            .fulltext
                            .push.apply(results
                                        .translated_texts
                                        .fulltext,
                                        data);

                        results.translated_texts.total_count += data.length;
                    })

                    .catch((err) => {
                        console.log("There was an error querying fts_translated_texts", JSON.stringify(err));
                        return res.send(err);
                    });

                actions.push(p);
            }

        }

        Promise.all(actions)
            .then(() => {
                return res.send(results);
            })
            .catch((err) => {
                res.send(err);
            });

    });

    express_app.get("/local-version", (req, res) => {
        let result = {};

        if (version.localVersion !== null) {
            result = version.localVersion;
        }

        return res.send(result);
    });

    express_app.get("/remote-version", (req, res) => {
        version.saveRemoteVersion()
            .then((data) => {
                return res.send(data);
            })
            .catch((err) => {
                return res.send({});
            });
    });

    express_app.get("/restart-force-update", (req, res) => {
        fs.writeFileSync(path.join(app_info.simsapaAppDataPath, "force-update.json"), "");
        app.relaunch();
        app.quit();
    });

    express_app.listen(3030, () => {
        console.log('Server is up on port 3030');
    });

    mainWindow.loadURL(url.format({
        protocol: "http",
        hostname: "localhost",
        port: 3030,
        pathname: "/index-desktop.html",
        slashes: true
    }));

    // 'new-window' is fired when external links are clicked, when they use target="_blank"
    mainWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();

        // this opens a new tab but in the backgroun, doesn't change the window focus
        //shell.openExternal(url);

        // this brings the browser window into focus
        opn(url);
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
};

// https://www.sqlite.org/fts5.html#full_text_query_syntax
// https://stackoverflow.com/questions/28971633/how-to-escape-string-for-sqlite-fts-query
// https://stackoverflow.com/questions/28860704/automatic-or-queries-using-sqlite-fts4

// Don't escape double quotes -- we'll warn the user that they have to be in pairs.

function escape_string_for_fts(query) {
    return query
        .replace(/'/g, "''")
        .replace(/[^A-Za-z0-9" ]/gi, '"$&"');
}
