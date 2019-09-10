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

    await waitFor('.container-3baos1'); // Waits Discord to load before autostart

    this.heartbeatInterval = heartbeatInterval;
    this.audio = document.createElement('audio');
    this.audio.autoplay = true;
    this.audio.src = 'https://listen.moe/stream'; // Feel free to change it to kpop if you want.
    this.audio.volume = 0.5;


    this.registerCommand(
      'lvolume',
      [],
      'Change the volume.',
      '{c} [0-1]',
      (args) => {
        if (args > 1 || args < 0) {
          return {
            send: false,
            result: 'You need to specify a number between 0 and 1.'
          };
        }
        this.audio.volume = args;
      }
    );

    this.registerCommand(
      'lpause',
      [],
      'Pause the music.',
      '{c}',
      () => {
        this.audio.pause();
      }
    );

    this.registerCommand(
      'lresume',
      [],
      'Resume the music.',
      '{c}',
      () => {
        this.audio.play();
      }
    );

    this.registerCommand(
      'lnp',
      [],
      'See what\'s now playing',
      '{c}',
      () => ({
        	send: false,
        result: `${data.song.title} by ${data.song.artists[0].nameRomaji || data.song.artists[0].name}`
      })
    );
  }
};
