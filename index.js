const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'public')));

app.use('/',(req,res,next) => {
  res.sendFile(path.join(__dirname,'public','index.html'));
});

app.listen(port, () => console.log(`App is listening on port ${port}!`))