const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'views')));

const db = new sqlite3.Database("godzinowki.db");
const saltRounds = 12;
app.post('/mainpage', (req, res) => {
    var sql = "SELECT password FROM users WHERE email = ?"
    var params = [req.body.email]
    db.get(sql, params, (err, row) => {
        if(!row) return res.render("index", {errorMessage: "Użytkownik nie istnieje"});

        bcrypt.compare(req.body.password, row.password, function (err, result) {
            if(result) return res.render("main_page")
            return res.render("index", {errorMessage: "Złe hasło"});
        });
    });
})

app.use('/',(req,res,next) => {
    res.render("index", {errorMessage: ''});
});

app.listen(port, () => console.log(`App is listening on port ${port}!`))
