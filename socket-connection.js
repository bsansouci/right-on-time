module.exports = function(server) {
  var soundcloud = require("./soundcloud-handler");
  if(!server) {
    server = require('http').Server(require('express')());
    server.listen(8080);
  }
  var io = require('socket.io')(server);
  io.on('connection', function (socket) {
    console.log("new socket connection");
    socket.on('load-track', function (data) {
      console.log("Requesting track", data);
      soundcloud(data, socket);
    });
    socket.on('play', function(data) {
      socket.broadcast.emit("play", data);
    });
  });
};