import { BrowserWindow } from 'electron';

const app_info = require('./app_info');
const path = require('path');

require(path.join(app_info.simsapaSrcPath, "main-process", "downloadAssets.js"));

export function create(mainWindow) {

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: path.join(app_info.simsapaSrcPath, "icons", "logo-letter-w64.png")
    });

    mainWindow.loadFile(path.join(app_info.simsapaSrcPath, "sections", "downloadAssets.html"));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

};
