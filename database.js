const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

const defaultDB = {
    owners: ["8678912390"],
    admins: [],
    groups: [],
    payments: {},
    duels: {}
};

let db = JSON.parse(JSON.stringify(defaultDB));

function save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function load() {
    try {
        const config = require('./config');

        if (fs.existsSync(DB_FILE)) {
         const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

         Object.keys(db).forEach(k => delete db[k]);
         Object.assign(db, data);
         }

        if (!Array.isArray(db.owners)) db.owners = [];
        if (!Array.isArray(db.admins)) db.admins = [];
        if (!Array.isArray(db.groups)) db.groups = [];

        if (
            config.MAIN_OWNER_ID &&
            !db.owners.includes(config.MAIN_OWNER_ID.toString())
        ) {
            db.owners.push(config.MAIN_OWNER_ID.toString());
        }

        save();
        console.log('✅ Database loaded');
    } catch (err) {
        console.error(err);

        db = JSON.parse(JSON.stringify(defaultDB));
        save();
    }
}

module.exports = {
    db,
    save,
    load
};