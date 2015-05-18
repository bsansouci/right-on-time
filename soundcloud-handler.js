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

// https://api.soundcloud.com/i1/tracks/90836050/streams?client_id=b45b1aa10f1ac2941910a7f0d10f8e28&app_version=9a98f21
//
// https://api.soundcloud.com/tracks/90836050/plays?policy=ALLOW&client_id=b45b1aa10f1ac2941910a7f0d10f8e28&app_version=9a98f21
//
//
// https://cf-media.sndcdn.com/1hLqwlscpWDd.128.mp3?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiKjovL2NmLW1lZGlhLnNuZGNkbi5jb20vMWhMcXdsc2NwV0RkLjEyOC5tcDMiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE0MzE5NzgxMTd9fX1dfQ__&Signature=tBk2wOrxnGv7esm4jQxl7IMPzLbuGHPxDizrdOvcc2VzIyQ2jH1x6dkSJXgs~xqd6vUp642Nk4rJF2JLiQnuE-2ab9exFJIcacuRghB5AhLfNOHU0kQVfj28vGVMlCBCarX5KGMRYSikqxqA7q-RXntu4~WL7uGetJ6g60yrjjCT8KDPTdYJnuqeotBPi~cRScFuT5jseE0glsQb0a7oj8PX7zLjbhU~gXTB~1ysh8akThqfm6TRhT6nPjhkDf5M9aANTDBlnp02ptZj7QceFCGd8i6CV8GTfd-Wh3WjK5Rqn9f7mL4rZQCLfyEU-EJ~5SMIAinP1VSeCHDA3fbN2g__&Key-Pair-Id=APKAJAGZ7VMH2PFPW6UQ



// var url = "https://soundcloud.com/djgodcrono/rock-and-roll-skrillex";
// _get(url, jar, function(err, res, html) {
//   var matches = html.match(/https:\/\/api.soundcloud.com\/tracks\/([0-9]+)\/download/);
//   if(matches.length < 2) throw new Error("Couldn't find download link with track id in it");


// });

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
    // var piping = request(data.http_mp3_128_url).pipe(fs.createWriteStream(url.split("/").pop() + '.mp3'));
    // piping.on("end", function() {

    // });
  });
};