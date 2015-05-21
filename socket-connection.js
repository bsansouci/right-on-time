module.exports = function(server) {
  var soundcloud = require("./soundcloud-handler");
  if(!server) {
    server = require('http').Server(require('express')());
    server.listen(8080);
  }
  var io = require('socket.io')(server);
  io.on('connection', function (socket) {
    socket.join('room');
    console.log("new socket connection");
    socket.on('load-track', function (data) {
      console.log("Requesting track", data);
      soundcloud(data, socket);
    });
    socket.on('play', function() {
      io.to('room').emit('play-now');
    });
  });
};