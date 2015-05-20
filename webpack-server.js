var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');
var initConnection = require("./socket-connection");

var server = new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true
});

server.listen(8081, 'localhost', function (err, result) {
  if (err) console.error(err);

  initConnection();
  console.log('Listening at localhost:8081');
});