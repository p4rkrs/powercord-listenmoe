const { Plugin } = require('powercord/entities');
const { waitFor } = require('powercord/util');

let heartbeatInterval;
let data;
let ws;

function heartbeat (interval) {
  heartbeatInterval = setInterval(() => {
    ws.send(JSON.stringify({ op: 9 }));
  }, interval);
}

function connect () {
  console.log('Connecting to WebSocket');
  ws = new WebSocket('wss://listen.moe/gateway_v2');

  ws.onopen = () => {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  };

  ws.onmessage = message => {
    if (!message.data.length) {
      return;
    }
    let response;
    try {
      response = JSON.parse(message.data);
    } catch (error) {
      return;
    }
    switch (response.op) {
      case 0:
        ws.send(JSON.stringify({ op: 9 }));
        console.log('Received OP 0 | Sent OP 9!');
        heartbeat(response.d.heartbeat);
        break;
      case 1:
        console.log('Received OP 1');
        if (response.t !== 'TRACK_UPDATE' && response.t !== 'TRACK_UPDATE_REQUEST' && response.t !== 'QUEUE_UPDATE' && response.t !== 'NOTIFICATION') {
          break;
        }
        data = response.d;
        break;
      default:
        break;
    }
  };

  ws.onclose = error => {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    if (ws) {
      ws.close();
      ws = null;
    }
    setTimeout(() => connect(), 5000);
  };
}


module.exports = class listenmoe extends Plugin {
  async startPlugin () {
    await connect();

    this.heartbeatInterval = heartbeatInterval;
    this.audio = document.createElement('audio');
    this.audio.src = 'https://listen.moe/stream'; // Feel free to change it to kpop if you want.
    this.audio.volume = 1;
    this.paused_data = null;

    this.registerCommand(
      'lplay',
      [],
      'Play playback of listen.moe',
      '{c}',
      () => {
          if (!this.audio.paused) {
            return {
              send: false,
              result: 'Playback is already playing!'
            }
          }
          this.audio.play();
          return {
            send: false,
            result: `Currently playing: ${data.song.title} by ${data.song.artists[0].nameRomaji || data.song.artists[0].name}`
          }
      }
    );

    this.registerCommand(
      'lstop',
      [],
      'Stop completly playback of listen.moe.',
      '{c}',
      () => {
          this.audio.currentTime = 0;
          this.audio.pause();
          return {
            send: false,
            result: 'The playback has been stopped.'
          }
      }
    );

    this.registerCommand(
      'lpause',
      [],
      'Pause playback of listen.moe',
      '{c}',
      () => {
        if (this.audio.paused) {
          return {
            send: false,
            result: 'The playback is already paused!'
          }
        } else {
          this.paused_data = data;
          this.audio.pause();
          return {
            send: false,
            result: 'The playback has been paused.'
          }
        }
      }
    );

    this.registerCommand(
      'lresume',
      [],
      'Resume playback of listen.moe',
      '{c}',
      () => {
        if (!this.audio.paused) {
          return {
            send: false,
            result: 'The playback is not paused!'
          }
        } else {
          this.audio.play();
          return {
            send: false,
            result: `Currently playing: ${this.paused_data.song.title} by ${this.paused_data.song.artists[0].nameRomaji || this.paused_data.song.artists[0].name} (Before the stream was paused)`
          }
        }
      }
    );


    this.registerCommand(
      'lvolume',
      [],
      'Change the volume.',
      '{c} <0-100>',
      (args) => {
        if (args[0]) {
          if (isNaN(args) || args > 100 || args < 0) return {
            send: false,
            result: 'You need to specify a number between 0 and 100.'
          };
          this.audio.volume = args / 100;
          return {
            send: false,
            result: `Volume has been set to ${args}%`
          }
        } else {
          return {
            send: false,
            result: `Current volume is: ${this.audio.volume * 100}%`
          }
        }
      }
    );

    this.registerCommand(
      'lnp',
      [],
      'See what\'s currently playing',
      '{c}',
      () => ({
        	send: false,
          result: `Currently playing: ${data.song.title} by ${data.song.artists[0].nameRomaji || data.song.artists[0].name}`
      })
    );
  }
};
