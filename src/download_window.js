import { BrowserWindow } from 'electron';

const path = require('path');

require(path.join(__dirname, "main-process", "downloadAssets.js"));

export function create(mainWindow) {

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: path.join(__dirname, "static", "assets", "icons", "logo-letter-w64.png")
    });

    mainWindow.loadFile(path.join(__dirname, "sections", "downloadAssets.html"));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

};
