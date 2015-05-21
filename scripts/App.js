import React from 'react';

let socket = io.connect('http://192.168.1.101:8080/');
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
SC.initialize({
  client_id: 'b45b1aa10f1ac2941910a7f0d10f8e28'
});
React.initializeTouchEvents(true);
var firebase = new Firebase("https://right-on-time.firebaseio.com/");
var roomName = "room1";
var db = firebase.child(roomName);

function partial(f) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    return f.apply(null, args.concat(Array.prototype.slice.call(arguments, 0)));
  };
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      soundAvailable: false,
      playlist: [],
    };
    this.enableSound = this.enableSound.bind(this);
    this.addToPlaylist = this.addToPlaylist.bind(this);
    this.removeFromPlaylist = this.removeFromPlaylist.bind(this);

    db.on("value", (snapshot) => {
      this.setState({
        playlist: snapshot.val() || []
      });
    });
  }

  enableSound() {
    var buffer = audioCtx.createBuffer(1, 1, 44100);
    var song = audioCtx.createBufferSource();
    song.buffer = buffer;
    song.connect(audioCtx.destination);
    song.start(0);
    song.stop(0);
    this.setState({
      soundAvailable: true
    });
  }

  // This avoids firebase/render loops
  // Assumes elements are in the same order
  shouldComponentUpdate(nextProps, nextState) {
    if(this.state.playlist.length !== nextState.playlist.length) return true;
    if(this.state.soundAvailable !== nextState.soundAvailable) return true;

    for (var i = 0; i < this.state.playlist.length; i++) {
      if(this.state.playlist[i].id !== nextState.playlist[i].id) return true;
    }


    return false;
  }

  componentWillUpdate(nextProps, nextState) {
    db.set(nextState.playlist);
  }

  addToPlaylist(track) {
    this.setState({
      playlist: this.state.playlist.concat([track])
    });
  }

  removeFromPlaylist(id) {
    this.setState({
      playlist: this.state.playlist.filter((x) => {return x.id !== id;})
    });
  }

  render() {
    if(!this.state.soundAvailable) return <button onClick={this.enableSound}>Enable sound</button>;

    var playlistStyle = {
      padding: 10,
      margin: 10,
      border: "1px solid black",
      borderRadius: 5
    };
    var playlist = this.state.playlist.map((x) => {
      return <div key={x.id} style={playlistStyle}>{x.title}<span onClick={partial(this.removeFromPlaylist, x.id)} style={{float:"right"}}>X</span></div>;
    });

    return (
      <div>
        <Search playlist={this.state.playlist} addToPlaylist={this.addToPlaylist} removeFromPlaylist={this.removeFromPlaylist}/>
        <Player playlist={this.state.playlist} addToPlaylist={this.addToPlaylist} removeFromPlaylist={this.removeFromPlaylist}/>
        <div style={{width: "50%", float: "right"}}>
          Playlist: <br />
          {playlist}
        </div>
      </div>
    );
  }
}

class Player extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      text: "Loading track...",
      curTrackIndex: 0,
      curTrack: null,
      cachedBuffer: null,
      playing: false,
      timeStartedPlaying: 0,
      totalTime: 0,
      volume: 50
    };

    this.togglePlay = this.togglePlay.bind(this);
    this.sendOnPlay = this.sendOnPlay.bind(this);
    this.onNext = this.onNext.bind(this);
    this.onVolumeChange = this.onVolumeChange.bind(this);
  }

  componentWillMount() {
    socket.on("play-now", (timestamp) => {
      this.togglePlay();
    });

    socket.on("track-buffer-data-end", (track) => {
      if(track.id !== this.props.playlist[this.state.curTrackIndex].id) return;

      audioCtx.decodeAudioData(track.buffer, (buf) => {
        var source = audioCtx.createBufferSource();
        source.buffer = buf;
        var gainNode = audioCtx.createGain();
        gainNode.gain.value = this.state.volume/100;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
        this.setState({
          cachedBuffer: buf,
          curTrack: source,
          gainNode: gainNode,
          playing: true,
          timeStartedPlaying: Date.now()
        });

        console.log("track loaded");
      }, console.error);
    });
  }

  togglePlay() {
    if(this.state.playing && this.state.curTrack) {
      this.state.curTrack.stop(0);
      this.setState({
        playing: false,
        curTrack: null,
        totalTime: this.state.totalTime + Date.now() - this.state.timeStartedPlaying
      });
    } else {
      if(this.state.cachedBuffer) {
        var source = audioCtx.createBufferSource();
        source.buffer = this.state.cachedBuffer;
        source.connect(this.state.gainNode);
        this.state.gainNode.connect(audioCtx.destination);
        source.start(0, this.state.totalTime/1000);

        this.setState({
          playing: true,
          curTrack: source,
          timeStartedPlaying: Date.now()
        });
      } else {
        socket.emit("load-track", this.props.playlist[this.state.curTrackIndex].id);
        // SC.stream("/tracks/" + this.props.playlist[this.state.curTrack].id, (sound) => {
        //   console.log(sound);
        //   this.setState({
        //     curBuffer: sound,
        //     playing: true
        //   });
        //   sound.setVolume(this.state.volume);

        //   sound.start(0);
        // });
      }
    }
  }

  sendOnPlay() {
    socket.emit("play");
  }

  onNext() {
    if(this.state.curTrack) this.state.curTrack.stop(0);

    this.setState({
      curTrackIndex: (this.state.curTrackIndex + 1) % this.props.playlist.length,
      curTrack: null,
      cachedBuffer: null,
      playing: false
    }, this.togglePlay);
  }

  onVolumeChange(e) {
    var newVolume = parseInt(e.target.value);
    this.setState({
      volume: newVolume
    });
    if(this.state.gainNode) this.state.gainNode.gain.value = newVolume/100;
  }

  render() {
    return (
      <div>
        <button style={{padding: 10}} onClick={this.sendOnPlay} disabled={this.props.playlist.length === 0}>
          {this.state.playing ? "\u275A\u275A" : "\u25BA"}
        </button>
        &nbsp;
        <button style={{padding: 10}} onClick={this.onNext} disabled={this.props.playlist.length === 0}>
          Next
        </button>
        &nbsp;
        <input type="range" min={0} max={100} onChange={this.onVolumeChange} value={this.state.volume} />
        volume: {this.state.volume}
      </div>
    );
  }
}

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchRes: [],
      lastSearch: 0,
      searchQuery: ""
    };
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.setState({
      lastSearch: Date.now(),
      searchQuery: e.target.value
    });
    SC.get('/tracks', { q: e.target.value }, (tracks) => {
      this.setState({
        searchRes: tracks
      });
    });
  }

  render() {
    var searchResStyle = {
      padding: 10,
      margin: 10,
      border: "1px solid black",
      borderRadius: 5
    };

    var searchRes = this.state.searchRes.map((x) => {
      return <div key={x.id} style={searchResStyle} onTouchStart={partial(this.props.addToPlaylist, x)} onClick={partial(this.props.addToPlaylist, x)}>{x.title}</div>;
    });

    return (
      <div>
        <input type={"text"} onChange={this.onChange} style={{fontSize: 24, position: "relative", top: 3}}/>
        <br /><br />
        <div style={{width: 800}}>
          <div style={{float: "left", maxHeight: 300, width: "50%", "overflow": "scroll"}}>
            Search results: <br />
            {searchRes}
          </div>
        </div>
      </div>
    );
  }
}

export default App;