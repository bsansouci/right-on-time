// // Fix up prefixing
// window.AudioContext = window.AudioContext || window.webkitAudioContext;
// var context = new AudioContext();

// function loadSound(url, callback) {
//   var request = new XMLHttpRequest();
//   request.open('GET', url, true);
//   request.responseType = 'arraybuffer';

//   // Decode asynchronously
//   request.onload = function() {
//     context.decodeAudioData(request.response, function(buffer) {
//       callback(buffer);
//     },console.error);
//   };
//   request.send();
// }

// function playSound(buffer) {
//   var source = context.createBufferSource(); // creates a sound source
//   source.buffer = buffer;                    // tell the source which sound to play
//   source.connect(context.destination);       // connect the source to the context's destination (the speakers)
//   source.start(0);                           // play the source now
//                                              // note: on older systems, may have to use deprecated noteOn(time);
// }
try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new window.AudioContext();
} catch (e) {
    console.log("No Web Audio API support");
}

/*
 * WebAudioAPISoundManager Constructor
 */
 var WebAudioAPISoundManager = function (context) {
    this.context = context;
    this.bufferList = {};
    this.playingSounds = {};
};

/*
 * WebAudioAPISoundManager Prototype
 */
WebAudioAPISoundManager.prototype = {
     addSound: function (url, callback) {
        // Load buffer asynchronously
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        var self = this;

        request.onload = function () {
            // Asynchronously decode the audio file data in request.response
            self.context.decodeAudioData(
                request.response,

                function (buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    self.bufferList[url] = buffer;
                    if(callback) callback();
                });
        };

        request.onerror = function () {
            alert('BufferLoader: XHR error');
        };

        request.send();
    },
    stopSoundWithUrl: function(url, latency) {
        if(this.playingSounds.hasOwnProperty(url)){
            for(var i in this.playingSounds[url]){
                if(this.playingSounds[url].hasOwnProperty(i))
                    this.playingSounds[url][i].stop(audioContext.currentTime + latency/1000);
            }
        }
    }
};

/*
 * WebAudioAPISound Constructor
 */
 var WebAudioAPISound = function (url, callback) {
    this.settings = {
      loop: false
    };

    // for(var i in options){
    //     if(options.hasOwnProperty(i))
    //         this.settings[i] = options[i];
    // }

    this.url = url + '.mp3';
    window.webAudioAPISoundManager = window.webAudioAPISoundManager || new WebAudioAPISoundManager(window.audioContext);
    this.manager = window.webAudioAPISoundManager;
    this.manager.addSound(this.url, callback);
};

/*
 * WebAudioAPISound Prototype
 */
WebAudioAPISound.prototype = {
    play: function (latency) {
        var buffer = this.manager.bufferList[this.url];
        //Only play if it's loaded yet
        if (typeof buffer !== "undefined") {
            var source = this.makeSource(buffer);
            source.loop = this.settings.loop;
            source.start(audioContext.currentTime + latency/1000);

            if(!this.manager.playingSounds.hasOwnProperty(this.url))
                this.manager.playingSounds[this.url] = [];
            this.manager.playingSounds[this.url].push(source);
        }
    },
    stop: function (latency) {
        this.manager.stopSoundWithUrl(this.url, latency);
    },
    getVolume: function () {
        return this.translateVolume(this.volume, true);
    },
    //Expect to receive in range 0-100
    setVolume: function (volume) {
        this.volume = this.translateVolume(volume);
    },
    translateVolume: function(volume, inverse){
        return inverse ? volume * 100 : volume / 100;
    },
    makeSource: function (buffer) {
        var source = this.manager.context.createBufferSource();
        if(!this.manager.context.createGainNode) this.manager.context.createGainNode = this.manager.context.createGain;
        var gainNode = this.manager.context.createGainNode();
        console.log(this.volume);
        gainNode.gain.value = this.volume ? this.volume : 1;
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.manager.context.destination);
        return source;
    }
};