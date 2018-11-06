// App and data version checking utilities

const app_info = require('./app_info');

const process = require('process');
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');

let remoteVersionUrl;

if (process.env.SIMSAPA_ENV == "development") {
    remoteVersionUrl = "https://cutt.ly/simsapa-version-json-dev";
} else {
    remoteVersionUrl = "https://cutt.ly/simsapa-version-json-prod";
}

const localVersionPath = path.join(app_info.simsapaAppDataPath, "local-version.json");
const remoteVersionPath = path.join(app_info.simsapaAppDataPath, "remote-version.json");

export let connectionError;
export let localVersion;
export let remoteVersion;

if (fs.existsSync(localVersionPath)) {
    localVersion = JSON.parse(fs.readFileSync(localVersionPath));
}

export function saveRemoteVersion() {
    return new Promise((resolve, reject) => {
        let userAgent;
        let chromeVersion = process.versions.chrome;

        switch (process.platform) {
        case "linux":
            userAgent = `Mozilla/5.0 (X11; Linux) Chrome/${chromeVersion}`;
            break;
        case "darwin":
            userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/${chromeVersion}`;
            break;
        case "win32":
            userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/${chromeVersion}`;
            break;
        default:
            userAgent = `Mozilla/5.0 (Unknown) Chrome/${chromeVersion}`;
        };

        let o = {
            method: "GET",
            url: remoteVersionUrl,
            headers: {
                'User-Agent': userAgent
            }
        };

        rp(o)
            .then((data) => {
                remoteVersion = JSON.parse(data);
                fs.writeFileSync(remoteVersionPath, data);

                if (!fs.existsSync(localVersionPath)) {
                    fs.writeFileSync(localVersionPath, data);
                    localVersion = remoteVersion;
                }
                resolve(remoteVersion);
            })
            .catch((err) => {
                connectionError = true;
                reject(err);
            });
    });
}

export function copyRemoteToLocal() {
    if (fs.existsSync(remoteVersionPath)) {
        fs.copyFileSync(remoteVersionPath, localVersionPath);
    }
}

