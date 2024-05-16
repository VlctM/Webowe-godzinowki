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

const db = new sqlite3.Database("godzinowki.db");
app.post('/mainpage', (req, res) => {
    var sql = "SELECT password FROM users WHERE email = ?";
    var params = [req.body.email];
    db.get(sql, params, (err, row) => {
        if(!row) return res.render("index", {errorMessage: "Użytkownik nie istnieje"});

        bcrypt.compare(req.body.password, row.password, function (err, result) {
            if(result) {
                if(req.body.remember_me) {
                    const date = new Date();
                    date.setDate(date.getDate() + 1605);
                    var session_cookie = crypto.randomBytes(16).toString('hex');
                    res.cookie("session_cookie", session_cookie, {expires: date});
                    db.run("UPDATE users SET session_cookie = ? WHERE email = ?", [session_cookie, req.body.email]);
                }
                return res.render("main_page");
            }
            return res.render("index", {errorMessage: "Złe hasło"});
        });
    });
})

app.use(cookieParser());
app.use('/',(req,res,next) => {
    db.get("SELECT email, first_name, last_name, role_id, dzial_id  FROM users WHERE session_cookie = ?", req.cookies.session_cookie, (err, row) => {
        if(!row) return res.render("index", {errorMessage: ''});
        return res.render("main_page");
    });
});

app.listen(port, () => console.log(`App is listening on port ${port}!`));
