var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8080);

app.use(express.static('./'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
// https://api.soundcloud.com/i1/tracks/45719017/streams?client_id=b45b1aa10f1ac2941910a7f0d10f8e28&app_version=9a98f21
io.on('connection', function (socket) {
  socket.emit('server-ready', { hello: 'world' });
  socket.on('play', function (data) {
    socket.broadcast.emit("play", data);
  });
});