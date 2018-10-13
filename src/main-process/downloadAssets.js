// downloadAssets.js: Main Process

const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const bizzy = require('bizzy');
const md5File = require('md5-file');

const {BrowserWindow, ipcMain, shell} = require('electron');

const version = require('../version');

/*
const dbTarName = "appdata.tar.bz2";
const staticTarName = "static-assets.tar.bz2";

const dbAsset = {
    tarName: dbTarName,
    msgId: 'database',
    tarUrl: `http://ssp.a-buddha-ujja.org/v0.1.0/${dbTarName}`,
    tarSavePath: path.join(__dirname, "..", dbTarName),
    extractDir: path.join(__dirname, ".."),
};

const staticAsset = {
    tarName: staticTarName,
    msgId: 'assets',
    tarUrl: `http://ssp.a-buddha-ujja.org/v0.1.0/${staticTarName}`,
    tarSavePath: path.join(__dirname, "..", staticTarName),
    extractDir: path.join(__dirname, ".."),
};
*/

ipcMain.on('download-database', (event) => {
    downloadAssetTarball(event, "database", version.localVersion.appdata_tar);
});

ipcMain.on('download-assets', (event) => {
    downloadAssetTarball(event, "assets", version.localVersion.assets_tar);
});

function downloadAssetTarball(event, msgId, assetVersion) {
    let tarSavePath = path.join(__dirname, "..", assetVersion.saveAs);

    progress(request(assetVersion.url))
        .on('progress', (state) => {
            const msg = "Downloading: " + (state.percent.toFixed(2) * 100) + "%";
            event.sender.send(`${msgId}-info`, msg);
        })
        .on('error', (err) => {
            event.sender.send(`${msgId}-error`, err);
        })
        .on('end', () => {
            const msg = `Downloaded to: ${tarSavePath}`;
            event.sender.send(`${msgId}-info`, msg);
            md5CheckTar(event, msgId, assetVersion);
        })
        .pipe(fs.createWriteStream(tarSavePath));
}

function md5CheckTar(event, msgId, assetVersion) {
    let tarSavePath = path.join(__dirname, "..", assetVersion.saveAs);

    md5File(tarSavePath, (err, hash) => {
        if (err) {
            const msg = `Download integrity check error: ${err}`;
            event.sender.send(`${msgId}-error`, msg);
            return;
        }

        if (assetVersion.md5.trim() == hash.trim()) {
            const msg = "Download integrity verified.";
            event.sender.send(`${msgId}-info`, msg);

            extractAsset(event, msgId, assetVersion);

        } else {
            const msg = "Download integrity check failed.";
            event.sender.send(`${msgId}-error`, msg);
        }
    });
}

function extractAsset(event, msgId, assetVersion) {
    let tarSavePath = path.join(__dirname, "..", assetVersion.saveAs);
    let extractDir = path.join(__dirname, "..");

    const extract = bizzy(tarSavePath, extractDir);

    event.sender.send(`${msgId}-info`, "Extracting...");

    /*
    extract.on('file', (name) => {
        const msg = `Extracted: ${name}%`;
        event.sender.send(`${msgId}-info`, msg);
    });
    */

    // This doesn't actually show progress. It shows 100% at one point but the
    // extraction is not yet finished.

    /*
    extract.on('progress', (percent) => {
        const msg = `Extracting: ${percent}%`;
        event.sender.send(`${msgId}-info`, msg);
    });
    */

    extract.on('error', (err) => {
        event.sender.send(`${msgId}-error`, err);
    });

    extract.on('end', () => {
        event.sender.send(`${msgId}-info`,  "Successfully extracted.");

        fs.unlink(tarSavePath, (err) => {
            if (err) throw err;
        });
    });
}
