import { app, BrowserWindow } from 'electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let mainWindow;
let assetsReady = false;

const fse = require('fs-extra');
const path = require('path');

const dbPath = path.join(__dirname, "appdata.sqlite3");
const assetsPath = path.join(__dirname, "static");
const indexPath = path.join(assetsPath, "index-desktop.html");

const simsapa_window = require('./simsapa_window');
const download_window = require('./download_window');

// If this is a force update start, remote already downloaded assets
if (fse.existsSync(path.join(__dirname, "force-update.json"))) {

    fse.removeSync(path.join(__dirname, "force-update.json"));

    if (fse.existsSync(dbPath)) {
        fse.removeSync(dbPath);
    }

    if (fse.existsSync(assetsPath)) {
        fse.removeSync(assetsPath);
    }

}

// If assets exist
if (fse.existsSync(dbPath) && fse.existsSync(indexPath)) {

    // Then open a window using the local assets.
    // Will check for available updates from there.
    assetsReady = true;
    app.on('ready', () => { simsapa_window.create(mainWindow, dbPath); });

} else {

    // Else it is probably the first time start.
    // Open a window to download the assets.
    assetsReady = false;
    app.on('ready', () => { download_window.create(mainWindow); });

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
            simsapa_window.create(mainWindow, dbPath);
        } else {
            download_window.create(mainWindow);
        }
    }
});

