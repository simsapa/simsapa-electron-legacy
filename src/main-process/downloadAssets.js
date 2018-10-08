// downloadAssets.js

const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const bizzy = require('bizzy');
const md5File = require('md5-file');

const {BrowserWindow, ipcMain, shell} = require('electron');

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

ipcMain.on('download-database', (event) => {
    downloadAssetTarball(event, dbAsset);
});

ipcMain.on('download-assets', (event) => {
    downloadAssetTarball(event, staticAsset);
});

function downloadAssetTarball(event, assetData) {
    progress(request(assetData.tarUrl))
        .on('progress', (state) => {
            const msg = "Downloading: " + (state.percent.toFixed(2) * 100) + "%";
            event.sender.send(`${assetData.msgId}-info`, msg);
        })
        .on('error', (err) => {
            event.sender.send(`${assetData.msgId}-error`, err);
        })
        .on('end', () => {
            const msg = `Downloaded to: ${assetData.tarSavePath}`;
            event.sender.send(`${assetData.msgId}-info`, msg);
            md5CheckTar(event, assetData);
        })
        .pipe(fs.createWriteStream(assetData.tarSavePath));
}

function md5CheckTar(event, assetData) {
    const md5Url = assetData.tarUrl + ".md5";
    request({ method: "GET", uri: md5Url}, (err, resp, body) => {
        if (resp.statusCode == 200) {
            let remoteHash = body;
            md5File(assetData.tarSavePath, (err, hash) => {
                if (err) {
                    const msg = `Md5 check error: ${err}`;
                    event.sender.send(`${assetData.msgId}-error`, msg)
                    return;
                }

                if (remoteHash.trim() == hash.trim()) {
                    const msg = "Tarball integrity OK";
                    event.sender.send(`${assetData.msgId}-info`, msg)

                    extractDatabase(event, assetData);

                } else {
                    const msg = "Tarball integrity check failed.";
                    event.sender.send(`${assetData.msgId}-error`, msg)
                }
            });
        } else {
            const msg = `Server Error ${resp.statusCode}: ${resp.statusMessage}`;
            event.sender.send(`${assetData.msgId}-error`, msg)
        }
    });
}

function extractDatabase(event, assetData) {
    const extract = bizzy(assetData.tarSavePath, assetData.extractDir);

    event.sender.send(`${assetData.msgId}-info`, "Extracting ...");

    extract.on('file', (name) => {
        const msg = `Extracted: ${name}%`;
        event.sender.send(`${assetData.msgId}-info`, msg);
    });

    extract.on('progress', (percent) => {
        const msg = `Extracting: ${percent}%`;
        event.sender.send(`${assetData.msgId}-info`, msg);
    });

    extract.on('error', (err) => {
        event.sender.send(`${assetData.msgId}-error`, err);
    });

    extract.on('end', () => {
        const msg = `Extracted to: ${assetData.extractDir}`;
        event.sender.send(`${assetData.msgId}-info`, msg);

        fs.unlink(assetData.tarSavePath, (err) => {
            if (err) throw err;
        });
    });
}
