const http = require('http');
const path = require('path');
const fs = require('fs');

const host = '127.0.0.1';
const port = 8080;

const plik = __dirname + '\\index.html';

function odpowiedz(req, res){
    switch(req.url){
        case '/':
            fs.readFile(plik, (err, dane) => {
                if(!err){
                    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                    res.end(`${dane}`);
                    console.log(`Otwarto stronę ${plik}`);
                } else {
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    console.dirr(err);
                    res.end('<h3>Strona o podanym adresie nie istnieje </h3>');
                }
            })
        break;
    }
}

const serwerWWW = http.createServer(odpowiedz);
serwerWWW.listen(port, host, () => console.log(`adres to ${host}:${port}`));