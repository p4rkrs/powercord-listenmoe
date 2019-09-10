const { Plugin } = require('powercord/entities');
const { waitFor } = require('powercord/util');

module.exports = class listenmoe extends Plugin {
	async startPlugin () {	
		await waitFor(`.container-3baos1`) // Waits Discord to load before autostart
			this.audio = document.createElement('audio')
			this.audio.autoplay = true
			this.audio.src = 'https://listen.moe/opus' // Feel free to change it to kpop if you want.
			this.audio.volume = 1;
			this.ws = new WebSocket('wss://listen.moe/gateway_v2');
			this.data = null;
			this.heartbeatInterval = null;
			ws.onopen = () => {
				clearInterval(this.heartbeatInterval);
				console.log('Opened WebSocket!')
				this.heartbeatInterval = null;
			};

			ws.onmessage = message => {
				if (!message.data.length) return;
				let response;
				try {
					response = JSON.parse(message.data);
				} catch (error) {
					return;
				}
				switch (response.op) {
					case 0:
						ws.send(JSON.stringify({ op: 9 }));
						console.log('Received OP 0 | Sent OP 9');
						heartbeat(response.d.heartbeat);
						break;
					case 1:
						if (response.t !== 'TRACK_UPDATE' && response.t !== 'TRACK_UPDATE_REQUEST' && response.t !== 'QUEUE_UPDATE' && response.t !== 'NOTIFICATION') break;
						this.data = response.d;
						break;
					default:
						break;
				}
			};
		
		
		this.registerCommand(
			'lvolume',
			[],
			'Change the volume.',
			'{c} [0-100]',
			(args) => {
				if (args > 100 || args < 0) return {
					send: false,
					result: 'You need to specify a number between 0 and 100.'
				}
				this.audio.volume = args;
			}
		)

		this.registerCommand(
			'lpause',
			[],
			'Pause the music.',
			'{c}',
			() => {
				this.audio.pause()
			}
		)

		this.registerCommand(
			'lresume',
			[],
			'Resume the music.',
			'{c}',
			() => {
				this.audio.resume()
			}
		)

		this.registerCommand(
			'lnp',
			[],
			'See what\'s now playing',
			'{c}',
			() => {
				return {
					send: false,
					result: `${this.data.song.title} by ${this.data.artists[0].name}`
				}
			}
		)
	}
}

function heartbeat(interval) {
	heartbeatInterval = setInterval(() => {
		ws.send(JSON.stringify({ op: 9 }));
	}, interval);
}
