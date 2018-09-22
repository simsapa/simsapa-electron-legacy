import { app, BrowserWindow } from 'electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const path = require('path');
const url = require('url');

const express = require('express');
const bodyParser = require('body-parser');

const express_app = express();

const Sequelize = require("sequelize");
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

    storage: path.join(__dirname, "development.sqlite3")
});

const db = require('./models');
const Op = Sequelize.Op;

const createWindow = () => {

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
WHERE word LIKE :query;`;

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
SELECT dict_words.*
FROM fts_dict_words
INNER JOIN dict_words ON dict_words.id = fts_dict_words.rowid
WHERE fts_dict_words MATCH :query
ORDER BY rank
LIMIT 20;`;

                return sequelize.query(items_sql, {
                    replacements: {
                        query: query + "*"
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
LIMIT 20;`;
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
SELECT root_texts.*
FROM fts_root_texts
INNER JOIN root_texts ON root_texts.id = fts_root_texts.rowid
WHERE fts_root_texts MATCH :search_content
ORDER BY rank
LIMIT 20;`;

                return sequelize.query(items_sql, {
                    replacements: {
                        search_content: query + "*"
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
        // translated_text.translated_title

            .then(() => {
                const items_sql = `
SELECT translated_texts.*
FROM translated_texts
WHERE acronym LIKE :q_acronym OR translated_title LIKE :q_title
ORDER BY acronym ASC
LIMIT 20;`;

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
SELECT translated_texts.*
FROM fts_translated_texts
INNER JOIN translated_texts ON translated_texts.id = fts_translated_texts.rowid
WHERE fts_translated_texts MATCH :search_content
ORDER BY rank
LIMIT 20;`;

                return sequelize.query(items_sql, {
                    replacements: {
                        search_content: query + "*"
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
        pathname: "/",
        slashes: true
    }));

    mainWindow.setMenuBarVisibility(false);

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

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
app.on('ready', createWindow);

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
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
