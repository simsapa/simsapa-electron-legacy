import { app, shell, BrowserWindow } from 'electron';

const fs = require('fs');
const path = require('path');
const url = require('url');

const express = require('express');
const body_parser = require('body-parser');
const opn = require('opn');

const express_app = express();

const sequelize_module = require("sequelize");

const version = require("./version");

export function create(mainWindow, dbPath) {

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: path.join(__dirname, "static", "assets", "icons", "logo-letter-w64.png")
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
    express_app.use(express.static(path.join(__dirname, 'static')));

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

        let results = [];

        sequelize_module.Promise.resolve(1)

        // word starts with

            .then(() => {
                const items_sql = `
SELECT * FROM dict_words
WHERE word LIKE :query;
`;

                return seq.query(items_sql, {
                    replacements: {
                        query: query + "%"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.DictWord
                })

                    .then((data) => results.push.apply(results, data))

                    .catch((err) => {
                        console.log("There was an error querying dict_words", JSON.stringify(err));
                        return res.send(err);
                    });
            })

        // fulltext search

            .then(() => {
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
ORDER BY rank
LIMIT 20;`;

                return seq.query(items_sql, {
                    replacements: {
                        query: escape_string_for_fts(query) + "*"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.DictWord
                })

                    .then((data) => {
                        results.push.apply(results, data);

                        return res.send(results);
                    })

                    .catch((err) => {
                        console.log("There was an error querying fts_dict_words", JSON.stringify(err));
                        return res.send(err);
                    });
            });
    });

    express_app.get("/search/texts", (req, res) => {
        const query = req.query.query;

        let results = {
            root_texts: [],
            translated_texts: []
        };

        sequelize_module.Promise.resolve(1)

        // root_texts.acronym starts with
        // root_text.title contains

            .then(() => {
                const items_sql = `
SELECT root_texts.*
FROM root_texts
WHERE acronym LIKE :q_acronym OR title LIKE :q_title
ORDER BY acronym ASC
LIMIT 20;
`;
                seq.query(items_sql, {
                    replacements: {
                        q_acronym: query + "%",
                        q_title: "%" + query + "%"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.RootText
                })

                    .then((data) => results.root_texts.push.apply(results.root_texts, data))

                    .catch((err) => {
                        console.log("There was an error querying root_texts", JSON.stringify(err));
                        return res.send(err);
                    });
            })

        // fts_root_texts.content_plain contains

            .then(() => {
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
ORDER BY rank
LIMIT 20;
`;

                return seq.query(items_sql, {
                    replacements: {
                        search_content: escape_string_for_fts(query) + "*"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.RootText
                })

                    .then((data) => results.root_texts.push.apply(results.root_texts, data))

                    .catch((err) => {
                        console.log("There was an error querying fts_root_texts", JSON.stringify(err));
                        return res.send(err);
                    });
            })

        // translated_texts.acronym
        // translated_text.title

            .then(() => {
                const items_sql = `
SELECT translated_texts.*
FROM translated_texts
WHERE acronym LIKE :q_acronym OR title LIKE :q_title
ORDER BY acronym ASC
LIMIT 20;
`;

                return seq.query(items_sql, {
                    replacements: {
                        q_acronym: query + "%",
                        q_title: "%" + query + "%"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.TranslatedText
                })

                    .then((data) => results.translated_texts.push.apply(results.translated_texts, data))

                    .catch((err) => {
                        console.log("There was an error querying translated_texts", JSON.stringify(err));
                        return res.send(err);
                    });
            })

        // fts_translated_texts.content_plain

        // return results

            .then(() => {
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
ORDER BY rank
LIMIT 20;
`;

                return seq.query(items_sql, {
                    replacements: {
                        search_content: escape_string_for_fts(query) + "*"
                    },
                    type: seq.QueryTypes.SELECT,
                    model: db.TranslatedText
                })

                    .then((data) => {
                        results.translated_texts.push.apply(results.translated_texts, data);

                        return res.send(results);
                    })

                    .catch((err) => {
                        console.log("There was an error querying fts_translated_texts", JSON.stringify(err));
                        return res.send(err);
                    });
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
        fs.writeFileSync(path.join(__dirname, "force-update.json"), "");
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
