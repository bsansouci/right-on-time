var request = require("request").defaults({jar: true});
var cheerio = require("cheerio");
var fs = require("fs");

function _get(url, jar, qs, callback) {
  if(typeof qs === 'function') {
    callback = qs;
    qs = {};
  }
  for(var prop in qs) {
    if(typeof qs[prop] === "object") {
      log.error("You probably shouldn't pass an object inside the form at property", prop, qs);
      continue;
    }
    qs[prop] = qs[prop].toString();
  }
  var op = {
    headers: {
      'Content-Type' : 'application/x-www-form-urlencoded',
      'Referer' : 'https://soundcloud.com/',
      'Host' : url.replace('https://', '').split("/")[0],
      'Origin' : 'https://soundcloud.com',
      'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/600.3.18 (KHTML, like Gecko) Version/8.0.3 Safari/600.3.18',
      'Connection' : 'keep-alive',
    },
    timeout: 60000,
    qs: qs,
    url: url,
    method: "GET",
    jar: jar,
    gzip: true
  };

  request(op, callback);
}

function _post(url, jar, form, callback) {
  var op = {
    headers: {
      'Content-Type' : 'application/x-www-form-urlencoded',
      'Referer' : 'https://soundcloud.com/',
      'Origin' : 'https://soundcloud.com',
      'Host' : url.replace('https://', '').split("/")[0],
      'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/600.3.18 (KHTML, like Gecko) Version/8.0.3 Safari/600.3.18',
      'Connection' : 'keep-alive',
    },
    timeout: 60000,
    url: url,
    method: "POST",
    form: form,
    jar: jar,
    gzip: true
  };

  request(op, callback);
}

var jar = request.jar();
module.exports = function(trackID, socket) {
  _get("https://api.soundcloud.com/i1/tracks/"+trackID+"/streams?", jar, {
    "client_id": "b45b1aa10f1ac2941910a7f0d10f8e28",
    "app_version": "9a98f21"
  }, function(err, res, html) {
    var data = JSON.parse(html);

    request(data.http_mp3_128_url)
    .on("data", function(data) {
      socket.emit("track-buffer-data", {track: trackID, buffer: data});
    })
    .on("end", function() {
      socket.emit("track-buffer-data-end", {track: trackID});
    });

  });
};