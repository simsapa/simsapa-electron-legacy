// downloadAssets.js: Main Process

const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const bizzy = require('bizzy');
const md5File = require('md5-file');

const { app, ipcMain } = require('electron');

const version = require('../version');

let downloading = false;

ipcMain.on('download', (event) => {
    if (downloading === true) {
        return;
    }

    downloading = true;

    var all_opts = [
        {
            event: event,
            msgId: 'assets',
            assetVersion: version.localVersion.assets_tar,
        },
        {
            event: event,
            msgId: 'database',
            assetVersion: version.localVersion.appdata_tar,
        },
    ];

    var processAsset = function(opts) {
        return new Promise((resolve, reject) => {
            downloadAssetTarball(opts)
                .then(() => { return md5CheckTar(opts); })
                .then(() => { resolve(extractAsset(opts)); })
                .catch((err) => {
                    opts.event.sender.send(`${opts.msgId}-error`, err);
                    reject(false);
                });
        });
    };

    var actions = all_opts.map(processAsset);

    var results = Promise.all(actions);

    results
        .then(() => {
            downloading = false;
            event.sender.send("show-restart");
        })
        .catch((err) => {
            console.log(err);
            throw err;
        });

});

ipcMain.on('restart', (event) => {
    app.relaunch();
    app.quit();
});

function downloadAssetTarball(opts) {
    return new Promise((resolve, reject) => {
        let tarSavePath = path.join(__dirname, "..", opts.assetVersion.saveAs);

        progress(request(opts.assetVersion.url))
            .on('progress', (state) => {
                let p = Math.floor(parseFloat(state.percent)*100);
                opts.event.sender.send(`${opts.msgId}-info`,  `Downloading ${opts.assetVersion.saveAs}: ${p}%`);
                opts.event.sender.send(`${opts.msgId}-progress`,  p);
            })
            .on('error', (err) => {
                reject(err);
            })
            .on('end', () => {
                opts.event.sender.send(`${opts.msgId}-info`, "");
                opts.event.sender.send(`${opts.msgId}-progress`, null);
                resolve(true);
            })
            .pipe(fs.createWriteStream(tarSavePath));
    });
}

function md5CheckTar(opts) {
    return new Promise((resolve, reject) => {
        let tarSavePath = path.join(__dirname, "..", opts.assetVersion.saveAs);

        md5File(tarSavePath, (err, hash) => {
            if (err) {
                opts.event.sender.send(`${opts.msgId}-error`, err);
                reject(err);
            }

            if (opts.assetVersion.md5.trim() == hash.trim()) {
                resolve(true);
            } else {
                const msg = "Download integrity check failed.";
                opts.event.sender.send(`${opts.msgId}-error`, msg);
                resolve(msg);
            }
        });
    });
}

function extractAsset(opts) {
    return new Promise((resolve, reject) => {
        let tarSavePath = path.join(__dirname, "..", opts.assetVersion.saveAs);
        let extractDir = path.join(__dirname, "..");

        opts.event.sender.send(`${opts.msgId}-info`, `Extracting ${opts.assetVersion.saveAs} ...`);

        const extract = bizzy(tarSavePath, extractDir);

        extract.on('error', (err) => {
            opts.event.sender.send(`${opts.msgId}-error`, err);
            reject(err);
        });

        extract.on('end', () => {
            opts.event.sender.send(`${opts.msgId}-info`,  "Completed.");

            fs.unlink(tarSavePath, (err) => {
                if (err) throw err;
            });

            resolve(true);
        });

        /*
          extract.on('file', (name) => {
          event.sender.send(`${msgId}-info`,  `Extracted: ${name}%`);
          });
        */

        // This doesn't actually show progress. It shows 100% at one point but the
        // extraction is not yet finished.

        /*
          extract.on('progress', (percent) => {
          event.sender.send(`${msgId}-info`,  `Extracting: ${percent}%`);
          });
        */
    });
}
