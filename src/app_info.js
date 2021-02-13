import { app } from 'electron';
const path = require('path');

export const simsapaAppDataPath = path.join(app.getPath('appData'), 'simsapa-legacy');
export const simsapaSrcPath = __dirname;
export const dbPath = path.join(simsapaAppDataPath, "appdata.sqlite3");
export const assetsPath = path.join(simsapaAppDataPath, "static");
export const indexPath = path.join(assetsPath, "index-desktop.html");
