const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const express = require('express');
const bodyParser = require('body-parser');

const express_app = express();

/*
const Sequelize = require("sequelize");
const sequelize = new Sequelize("database", "", "", {
    dialect: "sqlite",

    //operatorsAliases: false,

    //pool: {
    //    max: 5,
    //    min: 0,
    //    acquire: 30000,
    //    idel: 10000
    //},

    storage: path.join(__dirname, "development.sqlite3")
});
*/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 1920, height: 1080});

    express_app.use(bodyParser.json());
    express_app.use(express.static(path.join(__dirname, 'static')));

    express_app.get("/authors/:uid", (req, res) => {
        const uid = req.params.uid;
        // TODO
    });

    express_app.get("/search/dict_words/:query", (req, res) => {
        const query = req.params.query;
        // TODO
    });

    express_app.get("/search/texts/:query", (req, res) => {
        const query = req.params.query;
        // TODO
    });

    express_app.listen(3030, () => {
        console.log('Server is up on port 3030');
    });

    // and load the index.html of the app.
    //mainWindow.loadURL(url.format({
    //    pathname: path.join(__dirname, 'index.html'),
    //    protocol: 'file:',
    //    slashes: true
    //}));

    mainWindow.loadURL(url.format({
        protocol: "http",
        hostname: "localhost",
        port: 3030,
        pathname: "/",
        slashes: true
    }));

    //mainWindow.setMenuBarVisibility(false);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
