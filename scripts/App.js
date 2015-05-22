import React from 'react';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
SC.initialize({
  client_id: 'b45b1aa10f1ac2941910a7f0d10f8e28'
});
React.initializeTouchEvents(true);
const firebase = new Firebase("https://right-on-time.firebaseio.com/");
const roomName = "room1";
const db = firebase.child(roomName);

const Player = require("./Player");

function partial(f) {
  const args = Array.prototype.slice.call(arguments, 1);
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
      const v = snapshot.val();
      if(!v) return;

      this.setState({ playlist: v });
    });
  }

  componentDidMount() {
    const button = document.getElementById("enable-sound-button");
    const onceCallback = e => {
      button.removeEventListener("click", onceCallback);
      e.stopPropagation(); // Important to prevent React from dying
      this.enableSound();

    };
    button.addEventListener("click", onceCallback);
  }

  enableSound() {
    const buf = audioCtx.createBuffer(1, 1, 44100);
    let song = audioCtx.createBufferSource();
    song.buffer = buf;
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

    for (let i = 0; i < this.state.playlist.length; i++) {
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
      playlist: this.state.playlist.filter(x => x.id !== id)
    });
  }

  render() {
    if(!this.state.soundAvailable) return <button id="enable-sound-button">Enable sound</button>;

    let playlistStyle = {
      padding: 10,
      margin: 10,
      border: "1px solid black",
      borderRadius: 5
    };
    let playlist = this.state.playlist.map((x) => {
      return <div key={x.id} style={playlistStyle}>{x.title}<span onClick={partial(this.removeFromPlaylist, x.id)} style={{float:"right"}}>X</span></div>;
    });

    return (
      <div>
        <Search playlist={this.state.playlist}
                addToPlaylist={this.addToPlaylist}
                removeFromPlaylist={this.removeFromPlaylist} />
        <Player playlist={this.state.playlist}
                addToPlaylist={this.addToPlaylist}
                removeFromPlaylist={this.removeFromPlaylist}
                audioCtx={audioCtx} />
        <div style={{width: "50%", float: "right"}}>
          Playlist: <br />
          {playlist}
        </div>
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
    let searchResStyle = {
      padding: 10,
      margin: 10,
      border: "1px solid black",
      borderRadius: 5
    };

    let searchRes = this.state.searchRes.map((x) => {
      return <div key={x.id} style={searchResStyle} onTouchStart={partial(this.props.addToPlaylist, x)} onClick={partial(this.props.addToPlaylist, x)}>{x.title}</div>;
    });

    return (
      <div>
        <input type="text" onChange={this.onChange} style={{fontSize: 24, position: "relative", top: 3}} />
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