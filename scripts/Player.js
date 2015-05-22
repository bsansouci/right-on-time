import React from 'react';
import {partial} from './helper-functions';

let socket = io.connect('http://192.168.1.101:8080/');
let timeStartedPlaying = 0;
let totalTime = 0;
let gainNode = null;
let curTrackIndex = 0;
let pressedPlayOnce = false;

class Player extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playing: false,
      volume: 50,
      tracks: this.props.playlist.map(x => {return {state: "not-loaded", id: x.id};})
    };

    this.togglePlay = this.togglePlay.bind(this);
    this.sendOnPlay = this.sendOnPlay.bind(this);
    this.onNext = this.onNext.bind(this);
    this.onVolumeChange = this.onVolumeChange.bind(this);

    gainNode = this.props.audioCtx.createGain();
    gainNode.connect(this.props.audioCtx.destination);
  }

  componentWillMount() {
    socket.on("play-now", this.togglePlay);
    socket.on("next-song", this.onNext);

    socket.on("track-buffer-data-end", (track) => {
      // Don't need to decode the data if we already have the buffer cached
      if(track.id === this.props.playlist[curTrackIndex].id && this.props.playlist[curTrackIndex].state === "ready") return;

      this.props.audioCtx.decodeAudioData(track.buffer, buf => {
        let source = this.props.audioCtx.createBufferSource();
        source.buffer = buf;
        source.connect(gainNode);

        // If this is the track we've been waiting for, play it immediately
        if(track.id === this.props.playlist[curTrackIndex].id && pressedPlayOnce) {
          source.start(0);
          timeStartedPlaying = Date.now();
          this.setState({
            playing: true,
          });

          // If there's a next song, we pre-fetch it
          this.prefetchTrack(curTrackIndex + 1);
        }

        let index = -1;
        for (let i = 0; i < this.props.playlist.length; i++) {
          if(this.props.playlist[i].id === track.id) {
            index = i;
            continue;
          }
        }

        if(index === -1) return console.error("Received song not on playlist?", track);

        // Simply replace the previous state of the track
        this.state.tracks[index] = {
          state: "ready",
          source: source,
          id: track.id,
          cachedBuffer: buf,
        };
        this.setState({
          tracks: this.state.tracks
        });

        console.log("track loaded");
      }, console.error);
    });
  }

  componentDidMount() {
    this.prefetchTrack(curTrackIndex);
  }

  componentWillReceiveProps(nextProps) {
    let newTracks = new Array(nextProps.playlist.length);
    for (var i = 0; i < nextProps.playlist.length; i++) {
      if(i < this.state.tracks.length && nextProps.playlist[i].id === this.state.tracks[i].id) newTracks[i] = this.state.tracks[i];
      else newTracks[i] = {state: "not-loaded", id: nextProps.playlist[i].id};
    }

    this.setState({
      tracks: newTracks
    }, () => {
      this.prefetchTrack(curTrackIndex);
      this.prefetchTrack(curTrackIndex + 1);
    });
  }

  prefetchTrack(index) {
    if(index < this.state.tracks.length && this.state.tracks[index].state === "not-loaded") {
      console.log("prefetching", this.state.tracks[index].id, "-", index);
      this.state.tracks[index].state = "fetching";
      this.setState({
        tracks: this.state.tracks
      });

      socket.emit("load-track", this.state.tracks[index].id);
    }
  }

  togglePlay() {
    pressedPlayOnce = true;

    if(this.state.playing) {
      this.state.tracks[curTrackIndex].source.stop(0);
      this.state.tracks[curTrackIndex].source = null;
      totalTime += Date.now() - timeStartedPlaying;
      this.setState({
        playing: false
      });
    } else {
      if(this.state.tracks[curTrackIndex].state === "ready") {
        let source = this.props.audioCtx.createBufferSource();
        source.buffer = this.state.tracks[curTrackIndex].cachedBuffer;
        source.connect(gainNode);
        source.start(0, totalTime/1000);

        this.state.tracks[curTrackIndex].source = source;
        timeStartedPlaying = Date.now();
        this.setState({
          playing: true
        });

        this.prefetchTrack(curTrackIndex + 1);
      } else if(this.state.tracks[curTrackIndex].state === "not-loaded") {
        this.state.tracks[curTrackIndex].state = "fetching";
        socket.emit("load-track", this.props.playlist[curTrackIndex].id);
      } else {
        console.log(this.state.tracks[curTrackIndex]);
      }
    }
  }

  sendOnPlay() {
    socket.emit("play");
  }

  sendOnNext() {
    socket.emit("next");
  }

  onNext() {
    if(this.state.tracks[curTrackIndex].source) this.state.tracks[curTrackIndex].source.stop(0);

    // uuugh
    this.state.tracks[curTrackIndex] = {
      state: "not-loaded",
      id: this.state.tracks[curTrackIndex].id
    };

    curTrackIndex = (curTrackIndex + 1) % this.props.playlist.length;
    this.setState({
      playing: false,
      tracks: this.state.tracks
    }, this.togglePlay);
  }

  onVolumeChange(e) {
    const newVolume = parseInt(e.target.value);
    this.setState({
      volume: newVolume
    });
    if(gainNode) gainNode.gain.value = newVolume/100;
  }

  render() {
    let playlistStyle = {
      padding: 10,
      margin: 10,
      border: "1px solid black",
      borderRadius: 5
    };

    let playlist = this.props.playlist.map((x, i) => {
      return <div key={x.id} style={playlistStyle}>{curTrackIndex === i && this.state.playing ? "\u25BA" : (this.state.tracks[i].state === "ready" ? "\u2713" : (this.state.tracks[i].state === "fetching" ? "..." : ""))}{x.title}<span onClick={partial(this.props.removeFromPlaylist, x.id)} style={{float:"right"}}>X</span></div>;
    });

    return (
      <div>
        <button style={{padding: 10}} onClick={this.sendOnPlay} disabled={this.props.playlist.length === 0}>
          {this.state.playing ? "\u275A\u275A" : "\u25BA"}
        </button>
        &nbsp;
        <button style={{padding: 10}} onClick={this.sendOnNext} disabled={this.props.playlist.length === 0}>
          Next
        </button>
        &nbsp;
        <input type="range" min={0} max={100} onChange={this.onVolumeChange} value={this.state.volume} />
        volume: {this.state.volume}
        <br />
        <div style={{width: "50%", float: "right"}}>
          Playlist: <br />
          {playlist}
        </div>
      </div>
    );
  }
}

export default Player;