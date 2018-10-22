// downloadAssets.js: Render Process

const { ipcRenderer } = require('electron');

const downloadBtn = document.getElementById('download');

downloadBtn.addEventListener('click', (event) => {
    ipcRenderer.send('download');
});

let state = {
    database: {
        info_text: null,
        progress_percent: null,
        error_text: null,
    },
    assets: {
        info_text: null,
        progress_percent: null,
        error_text: null,
    },
};

function infoTemplate(s) {
    let res = "";

    if (s.info_text !== null) {
        res += `
<div class="level">
    <div class="level-item">${s.info_text}</div>
</div>`;
    }

    if (s.progress_percent !== null) {
        res += `
<div class="level">
    <div class="level-item">
        <progress class="progress" value="${s.progress_percent}" max="100">${s.progress_percent}%</progress>
    </div>
</div>`;
    }

    if (s.error_text !== null) {
        res += `
<div class="level">
    <div id="database-error" class="level-item">${s.error_text}</div>
</div>`;
    }

    return res;
}

function updateContent(id, data) {
    document.getElementById(id).innerHTML = infoTemplate(data);
}

ipcRenderer.on('database-progress', (event, percent) => {
    state.database.progress_percent = percent;
    updateContent('database-wrap', state.database);
});

ipcRenderer.on('database-info', (event, msg) => {
    state.database.info_text = msg;
    updateContent('database-wrap', state.database);
});

ipcRenderer.on('database-error', (event, msg) => {
    state.database.error_text = msg;
    updateContent('database-wrap', state.database);
});

ipcRenderer.on('assets-progress', (event, percent) => {
    state.assets.progress_percent = percent;
    updateContent('assets-wrap', state.assets);
});

ipcRenderer.on('assets-info', (event, msg) => {
    state.assets.info_text = msg;
    updateContent('assets-wrap', state.assets);
});

ipcRenderer.on('assets-error', (event, msg) => {
    state.assets.error_text = msg;
    updateContent('assets-wrap', state.assets);
});

ipcRenderer.on('show-restart', () => {
    let content = `
<div class="level">
    <div class="level-item">
        All tasks are completed. Click the button to restart the application.
    </div>
</div>
<div class="level">
    <div class="level-item button-wrap">
        <button id="restart" class="button is-info">Restart</button>
    </div>
</div>`;

    document.getElementById('restart-wrap').innerHTML = content;

    document
        .getElementById('restart')
        .addEventListener('click', (event) => {
            ipcRenderer.send('restart');
        });
});

ipcRenderer.on('status-clear', (event) => {
    document.getElementById('status-wrap').innerHTML = "";
});

ipcRenderer.on('status-error', (event, msg) => {
    let content = `
<div class="level">
    <div class="level-item">${msg}</div>
</div>`;
    document.getElementById('status-wrap').innerHTML = content;
});
