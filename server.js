var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var soundcloud = require("./soundcloud-handler");
server.listen(8080);

app.use(express.static('./'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log("new socket connection");
  socket.emit('server-ready');
  socket.on('load-track', function (data) {
    console.log("Requesting track", data);
    soundcloud(data, socket);
  });
  socket.on('play', function(data) {
    socket.broadcast.emit("play", data);
  });
});