import React from 'react';
import {partial} from './helper-functions';
import Search from './Search';
import Player from './Player';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
SC.initialize({
  client_id: 'b45b1aa10f1ac2941910a7f0d10f8e28'
});
React.initializeTouchEvents(true);
const firebase = new Firebase("https://right-on-time.firebaseio.com/");
const roomName = "room1";
const db = firebase.child(roomName);

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

    return (
      <div>
        <Search playlist={this.state.playlist}
                addToPlaylist={this.addToPlaylist}
                removeFromPlaylist={this.removeFromPlaylist} />
        <Player playlist={this.state.playlist}
                addToPlaylist={this.addToPlaylist}
                removeFromPlaylist={this.removeFromPlaylist}
                audioCtx={audioCtx} />
      </div>
    );
  }
}

export default App;