import React from 'react';
import {partial} from './helper-functions';


let searchQuery = -1;
let totalQueries = 0;

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchRes: []
    };
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    const id = totalQueries++;
    searchQuery = id;
    SC.get('/tracks', { q: e.target.value }, tracks => {
      if(searchQuery !== id) return;
      searchQuery = -1;
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

export default Search;