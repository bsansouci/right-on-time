var express = require('express');
var app = express();
var server = require('http').Server(app);
var initConnection = require("./socket-connection");

server.listen(8080);
initConnection(server);
app.use(express.static('./'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});