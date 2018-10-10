import { app, BrowserWindow } from 'electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let mainWindow;

const fs = require('fs');
const path = require('path');
const url = require('url');

const express = require('express');
const bodyParser = require('body-parser');

const express_app = express();

const Sequelize = require("sequelize");

let assetsReady = false;

const dbPath = path.join(__dirname, "appdata.sqlite3");
const assetsPath = path.join(__dirname, "static");

if (fs.existsSync(dbPath) && fs.existsSync(path.join(assetsPath, "index-desktop.html"))) {
    assetsReady = true;
}

const createWindowWithoutAssets = () => {

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: path.join(__dirname, "icons", "logo-letter-w64.png")
    });

    mainWindow.loadFile(path.join(__dirname, "sections", "downloadAssets.html"));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

};

const createWindowWithAssets = () => {

    const sequelize = new Sequelize({
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
    const Op = Sequelize.Op;


    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: path.join(__dirname, "static", "assets", "icons", "logo-letter-w64.png")
    });

    express_app.use(bodyParser.json());
    express_app.use(express.static(path.join(__dirname, 'static')));

    express_app.get("/authors/:uid", (req, res) => {
        const author_uid = req.params.uid;

        return sequelize.query("SELECT * FROM authors WHERE uid = :uid;", {
            replacements: {
                uid: author_uid
            },
            type: sequelize.QueryTypes.SELECT,
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

        Sequelize.Promise.resolve(1)

        // word starts with

            .then(() => {
                const items_sql = `
SELECT * FROM dict_words
WHERE word LIKE :query;
`;

                return sequelize.query(items_sql, {
                    replacements: {
                        query: query + "%"
                    },
                    type: sequelize.QueryTypes.SELECT,
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

                return sequelize.query(items_sql, {
                    replacements: {
                        query: escape_string_for_fts(query) + "*"
                    },
                    type: sequelize.QueryTypes.SELECT,
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

        Sequelize.Promise.resolve(1)

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
                sequelize.query(items_sql, {
                    replacements: {
                        q_acronym: query + "%",
                        q_title: "%" + query + "%"
                    },
                    type: sequelize.QueryTypes.SELECT,
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

                return sequelize.query(items_sql, {
                    replacements: {
                        search_content: escape_string_for_fts(query) + "*"
                    },
                    type: sequelize.QueryTypes.SELECT,
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

                return sequelize.query(items_sql, {
                    replacements: {
                        q_acronym: query + "%",
                        q_title: "%" + query + "%"
                    },
                    type: sequelize.QueryTypes.SELECT,
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

                return sequelize.query(items_sql, {
                    replacements: {
                        search_content: escape_string_for_fts(query) + "*"
                    },
                    type: sequelize.QueryTypes.SELECT,
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

    // This doesn't show up in production builds anyway.
    //mainWindow.setMenuBarVisibility(true);

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

if (assetsReady) {
    app.on('ready', createWindowWithAssets);
} else {
    app.on('ready', createWindowWithoutAssets);
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        if (assetsReady) {
            createWindowWithAssets();
        } else {
            createWindowWithoutAssets();
        }
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// https://www.sqlite.org/fts5.html#full_text_query_syntax
// https://stackoverflow.com/questions/28971633/how-to-escape-string-for-sqlite-fts-query
// https://stackoverflow.com/questions/28860704/automatic-or-queries-using-sqlite-fts4

// Don't escape double quotes -- we'll warn the user that they have to be in pairs.

function escape_string_for_fts(query) {
    return query
        .replace(/'/g, "''")
        .replace(/[^A-Za-z0-9" ]/gi, '"$&"');
}

require(path.join(__dirname, "main-process", "downloadAssets.js"));

