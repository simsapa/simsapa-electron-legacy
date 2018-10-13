// App and data version checking utilities

const fs = require('fs');
const path = require('path');
const rp = require('request-promise');

const versionUrl = "http://ssp.a-buddha-ujja.org/version.json";
const versionPath = path.join(__dirname, "version.json");

export const localVersion = JSON.parse(fs.readFileSync(versionPath));

export async function getRemoteVersion() {
    let o = { method: "GET", url: versionUrl };

    await rp(o)
        .then((body) => {
            return JSON.parse(body);
        })
        .catch((err) => {
            return err;
        });
}

/*
version.getRemoteVersion()
    .then((data) => { remoteVersion = data; })
    .catch((err) => { console.log('Error: ' + err); });
*/


