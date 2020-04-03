// 引入模块依赖
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const https = require('https');


const app = express();
let key = fs.readFileSync('');
let cert = fs.readFileSync('');
let ca = fs.readFileSync('');
app.use(express.static('uploads'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, TRACE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Credentials", true);
    if (req.method == "OPTIONS") {
        res.send(200);
    } else {
        next();
    }
});
let options = {
    key: key,
    cert: cert,
    ca: ca
};
const routes = require("./routes.js");
app.use("", routes);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

const httpsServer = https.createServer(options, app);
httpsServer.listen(443, () => {
    console.log('listening 443 port');
});
module.exports = app;

