// downloadAssets.js

const {ipcRenderer} = require('electron');

const downloadDatabaseBtn = document.getElementById('download-database');

downloadDatabaseBtn.addEventListener('click', (event) => {
    ipcRenderer.send('download-database');
});

ipcRenderer.on('database-error', (event, msg) => {
    document.getElementById('database-error').innerHTML = msg;
});

ipcRenderer.on('database-info', (event, msg) => {
    document.getElementById('database-info').innerHTML = msg;
});

const downloadAssetsBtn = document.getElementById('download-assets');

downloadAssetsBtn.addEventListener('click', (event) => {
    ipcRenderer.send('download-assets');
});

ipcRenderer.on('assets-error', (event, msg) => {
    document.getElementById('assets-error').innerHTML = msg;
});

ipcRenderer.on('assets-info', (event, msg) => {
    document.getElementById('assets-info').innerHTML = msg;
});

