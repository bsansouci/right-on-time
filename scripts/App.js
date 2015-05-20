import React from 'react';

let socket = io.connect('http://192.168.1.101:8080/');
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var song = null;
var cachedBuffer = null;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      init: true
    };
    this.onClick = this.onClick.bind(this);
  }
  onClick() {
    var buffer = audioCtx.createBuffer(1, 1, 44100);
    song = audioCtx.createBufferSource();
    song.buffer = buffer;
    song.connect(audioCtx.destination);
    song.start(0);
    song.stop(0);
    this.setState({
      init: false
    });
  }
  render() {
    return (
      <div>
      {
        this.state.init ?
        <button onClick={this.onClick}>Enable sound</button> : <PlayButton />
      }
      </div>
    );
  }
}

class PlayButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      disabled: true,
      text: "Loading track..."
    };
  }
  onClick() {
    var timestamp = Date.now() + 2000;
    socket.emit("play", timestamp);
    console.log("click event received", (timestamp - Date.now())/1000);
    // song.start(timestamp - audioCtx.currentTime);
    song = audioCtx.createBufferSource();
    song.buffer = cachedBuffer;
    song.connect(audioCtx.destination);
    song.start(audioCtx.currentTime + (timestamp - Date.now())/1000);
  }
  componentWillMount() {
    socket.emit("load-track", 190874710);
    socket.on("track-buffer-data-end", (track) => {
      audioCtx.decodeAudioData(track.buffer, (buffer) => {
        cachedBuffer = buffer;
        console.log("track loaded");
        this.setState({
          disabled: false,
          text: "Play"
        });
      }, console.error);
    });

    socket.on("play", function(timestamp) {
      console.log("receive play from server, playing in", (timestamp - Date.now())/1000);
      song = audioCtx.createBufferSource();
      song.buffer = cachedBuffer;
      song.connect(audioCtx.destination);
      song.start(audioCtx.currentTime + (timestamp - Date.now())/1000);
    });
  }
  render() {
    return (
      <div>
        <button id="play-button" disabled={this.state.disabled} onClick={this.onClick}>
          {this.state.text}
        </button>
      </div>
    );
  }
}

export default App;