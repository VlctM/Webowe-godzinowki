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

const db = new sqlite3.Database("godzinowki.sqlite3");
app.post('/mainpage', (req, res) => {
    var sql = `SELECT u.email, u.first_name, u.last_name, u.role_id, u.password, GROUP_CONCAT(d.name) AS dzialy_names
        FROM users u
        JOIN users_dzialy ud ON u.id = ud.user_id
        JOIN dzialy d ON ud.dzial_id = d.id
        WHERE u.email = ?
    `;
    var params = [req.body.email];
    db.get(sql, params, (err, row) => {
        if(!row) return res.render("index", {errorMessage: "Użytkownik nie istnieje"});

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

app.use('/admin',(req,res) => {
    db.get('SELECT role_id FROM users WHERE session_cookie = ?', req.cookies.session_cookie, (err, row) => {
        return res.render("admin", {
            role_id: row.role_id,
            errorMessage: ""
        });
    });
});

app.use('/new_project',(req,res) => {
    db.run("INSERT INTO projects (name) VALUES (?)", req.body.project_name, (err) => {
        if(err && err.code == "SQLITE_CONSTRAINT") {
            db.get('SELECT role_id FROM users WHERE session_cookie = ?', req.cookies.session_cookie, (err, row) => {
                return res.render("admin", {
                    role_id: row.role_id,
                    errorMessage: "Kod projektu już istnieje"
                });
            });
        }
        else {
            db.get('SELECT role_id FROM users WHERE session_cookie = ?', req.cookies.session_cookie, (err, row) => {
                return res.render("admin", {
                    role_id: row.role_id,
                    errorMessage: ""
                });
            });
        }
    });
});

app.use('/',(req,res,next) => {
    var sql = `SELECT u.email, u.first_name, u.last_name, u.role_id, GROUP_CONCAT(d.name) AS dzialy_names
        FROM users u
        JOIN users_dzialy ud ON u.id = ud.user_id
        JOIN dzialy d ON ud.dzial_id = d.id
        WHERE u.session_cookie = ?
    `;
    db.get(sql, req.cookies.session_cookie, (err, row) => {
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

app.listen(port, () => console.log(`App is listening on port ${port}!`));
