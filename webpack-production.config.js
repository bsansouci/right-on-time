var path = require('path');
var webpack = require('webpack');

module.exports = {
  debug: true,
  entry: './scripts/index',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/build/'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loaders: ['babel'],
      include: path.join(__dirname, 'scripts')
    }]
  }
};