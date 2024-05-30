const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'views')));
app.use(cookieParser());
let role_id;
let emailsrow;

const db = new sqlite3.Database("godzinowki.sqlite3");

app.post('/mainpage', async (req, res) => {
    var sql = `SELECT u.email, u.first_name, u.last_name, u.role_id, u.password, GROUP_CONCAT(d.name) AS dzialy_names
        FROM users u
        JOIN users_dzialy ud ON u.id = ud.user_id
        JOIN dzialy d ON ud.dzial_id = d.id
        WHERE u.email = ?
    `;
    var params = [req.body.email];
    roledb = await new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
        if(!row) return res.render("index", {errorMessage: "Użytkownik nie istnieje"});
        resolve(row);

        bcrypt.compare(req.body.password, row.password, function (err, result) {
            if(result) {
                const date = new Date();
                var session_cookie = crypto.randomBytes(16).toString('hex');
                db.run("UPDATE users SET session_cookie = ? WHERE email = ?", [session_cookie, req.body.email]);

                if(req.body.remember_me) {
                    date.setDate(date.getDate() + 1605);
                    res.cookie("session_cookie", session_cookie, {expires: date});
                }
                else res.cookie("session_cookie", session_cookie);
                return res.render("main_page", {
                    email: row.email,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    role_id: row.role_id,
                    dzialy_names: row.dzialy_names
                });
            }
            return res.render("index", {errorMessage: "Złe hasło"});
        });
        });
    });
});

app.use('/active_projects', (req,res) => {
    db.get("SELECT * FROM projects WHERE end_date IS NULL", (err,row) => {
        return res.render("projects", {
            project_ids: row.id,
            project_names: row.name
        });
    });
});
app.use('/finished_projects', (req,res) => {
    db.get("SELECT * FROM projects WHERE end_date IS NOT NULL", (err,row) => {
        return res.render("projects", {
            project_ids: row.id,
            project_names: row.name
        });
    });
});

app.use('/admin', async (req,res) => {
    emailsRow = await new Promise((resolve, reject) => {
    db.get('SELECT GROUP_CONCAT(email) as emails FROM users WHERE fired = 0', (err, row) => {
        if (err) reject(err);
            else resolve(row);
        });
    });
    db.get('SELECT role_id FROM users WHERE session_cookie = ?', req.cookies.session_cookie, (err, row) => {
        return res.render("admin", {
            role_id: roledb.role_id,
            emails: emailsRow.emails.split(','),
            errorMessage: "",
            errorMessage1: "",
        });
    });
});

app.use('/new_project',(req,res) => {
    db.run("INSERT INTO projects (name) VALUES (?)", req.body.project_name, (err) => {
        if(err && err.code == "SQLITE_CONSTRAINT") {
            return res.render("admin", {
                role_id: roledb.role_id,
                emails: emailsRow.emails.split(','),
                errorMessage: "Kod projektu już istnieje",
                errorMessage1: ""
            });
        }
        else {
            return res.render("admin", {
                role_id: roledb.role_id,
                emails: emailsRow.emails.split(','),
                errorMessage: "",
                errorMessage1: ""
            });
        }
    });
});

app.use('/add_workers', async (req,res) => {
    if(req.body.workersText || req.body.workers) {
        let flattenedAllWorkers;
        if(req.body.workersText && req.body.workers) {
            var flattenedWorkersText = req.body.workersText.split(',').map(email => email.trim());

            if(Array.isArray(req.body.workers)) {
                flattenedWorkers = [].concat(...req.body.workers);
            } else flattenedWorkers = req.body.workers;

            flattenedAllWorkers = flattenedWorkersText.concat(flattenedWorkers);
        } else if(req.body.workersText) {
            flattenedAllWorkers = req.body.workersText.split(',').map(email => email.trim());
        } else if(req.body.workers) {
            if(Array.isArray(req.body.workers)) {
                flattenedAllWorkers = [].concat(...req.body.workers);
            } else flattenedAllWorkers = req.body.workers;
        }

        id_for_project = await new Promise((resolve, reject) => {
            db.get("SELECT id FROM projects WHERE name = ?", req.body.project, (err, row) => {
                if(row) resolve(row.id);
                else return res.render("admin", {
                    role_id: roledb.role_id,
                    emails: emailsRow.emails.split(','),
                    errorMessage: "",
                    errorMessage1: "Taki projekt nie istnieje"
                });
            });
        });

        if(Array.isArray(flattenedAllWorkers)) {
            let sql = "SELECT GROUP_CONCAT(id) as ids FROM users WHERE email = '" + flattenedAllWorkers[0] + "'";
            for(i = 1; i < flattenedAllWorkers.length; i++) {
                sql += " OR email = '" + flattenedAllWorkers[i] + "'";
            }
            ids_for_emails = await new Promise((resolve, reject) => {
                db.get(sql, (err, row) => {
                    if(row.ids) resolve( row.ids.split(',').map( id => id.trim() ) );
                    else {
                        return res.render("admin", {
                            role_id: roledb.role_id,
                            emails: emailsRow.emails.split(','),
                            errorMessage: "",
                            errorMessage1: "Przynajmniej jeden z wpisanych adresów nie istnieje"
                        });
                    }
                });
            });

            for(let i = 0; i < ids_for_emails.length; i++) {
                db.run("INSERT INTO project_users (project_id, user_id) VALUES (?,?)", id_for_project, ids_for_emails[i], (err, row) => {
                    if(err && err.code == "SQLITE_CONSTRAINT") {
                        console.log("User with id "+ids_for_emails[i]+" is already assigned to the project");
                    }
                });
            }
        } else {
            id_for_email = await new Promise((resolve, reject) => {
                db.get("SELECT id FROM users WHERE email = '?'", flattenedAllWorkers, (err, row) => {
                        resolve(row.id);
                });
            });

            db.run("INSERT INTO project_users (project_id, user_id) VALUES ('?','?')", id_for_project, id_for_email);
        }

        return res.render("admin", {
            role_id: roledb.role_id,
            emails: emailsRow.emails.split(','),
            errorMessage: "",
            errorMessage1: ""
        });
    } else { 
        return res.render("admin", {
            role_id: roledb.role_id,
            emails: emailsRow.emails.split(','),
            errorMessage: "",
            errorMessage1: "Wybierz przynajmniej jeden email"
        });
    }
});

app.use('/', async (req,res,next) => {
    var sql = `SELECT u.email, u.first_name, u.last_name, u.role_id, GROUP_CONCAT(d.name) AS dzialy_names
        FROM users u
        JOIN users_dzialy ud ON u.id = ud.user_id
        JOIN dzialy d ON ud.dzial_id = d.id
        WHERE u.session_cookie = ?
    `;
    roledb = await new Promise((resolve, reject) => {
        db.get(sql, req.cookies.session_cookie, (err, row) => {
            resolve(row);
            if(!row.dzialy_names) return res.render("index", {errorMessage: ''});
            return res.render("main_page", {
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
                role_id: row.role_id,
                dzialy_names: row.dzialy_names
            });
        });
    });
});

app.listen(port, () => console.log(`App is listening on port ${port}!`));
