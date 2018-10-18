// App and data version checking utilities

const fs = require('fs');
const path = require('path');
const rp = require('request-promise');

let remoteVersionUrl;

if (process.env.SIMSAPA_ENV == "development") {
    remoteVersionUrl = "https://cutt.ly/simsapa-version-json-dev";
} else {
    remoteVersionUrl = "https://cutt.ly/simsapa-version-json-prod";
}

const localVersionPath = path.join(__dirname, "local-version.json");
const remoteVersionPath = path.join(__dirname, "remote-version.json");

export let connectionError;
export let localVersion;
export let remoteVersion;

if (fs.existsSync(localVersionPath)) {
    localVersion = JSON.parse(fs.readFileSync(localVersionPath));
}

export function saveRemoteVersion() {
    return new Promise((resolve, reject) => {
        let o = { method: "GET", url: remoteVersionUrl };

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

