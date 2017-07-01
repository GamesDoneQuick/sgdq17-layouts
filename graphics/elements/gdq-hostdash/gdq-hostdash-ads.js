(function () {
	'use strict';

	const currentIntermission = nodecg.Replicant('currentIntermission');
	const casparConnected = nodecg.Replicant('caspar:connected');
	const streamingOBSWebsocket = nodecg.Replicant('streamingOBS:websocket');

	class GdqHostDashboardAds extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-hostdash-ads';
		}

		static get properties() {
			return {
				_connectedToNodeCG: {
					type: Boolean,
					value: true,
					readOnly: true
				}
			};
		}

		ready() {
			super.ready();
			this._checkCover = this._checkCover.bind(this);
			currentIntermission.on('change', newVal => {
				this.content = newVal.content;
			});
			casparConnected.on('change', this._checkCover);
			streamingOBSWebsocket.on('change', this._checkCover);

			window.socket.on('disconnect', () => {
				this._set_connectedToNodeCG(false);
				this._checkCover();
			});

			window.socket.on('reconnect', () => {
				this._set_connectedToNodeCG(true);
				this._checkCover();
			});
		}

		equal(a, b) {
			return a === b;
		}

		_checkCover() {
			if (!casparConnected.value || !streamingOBSWebsocket.value) {
				return;
			}

			this.$.cover.hidden = false;

			const casparIsConnected = casparConnected.value;
			const streamingOBSWebsocketIsConnected = streamingOBSWebsocket.value.status === 'connected';
			if (!this._connectedToNodeCG) {
				this.$.cover.innerHTML = 'Disconnected from NodeCG!<br/>' +
					'Ads cannot be played until we reconnect.' +
					'<br/><br/>Tell the producer immediately!';
			} else if (!casparIsConnected && !streamingOBSWebsocketIsConnected) {
				this.$.cover.innerHTML = 'CasparCG and the streaming OBS are both disconnected!<br/>' +
						'Ads cannot be played until both of them are connected.' +
					'<br/><br/>Tell the producer immediately!';
			} else if (!casparIsConnected) {
				this.$.cover.innerHTML = 'CasparCG is disconnected!<br/>' +
						'Ads cannot be played until it is connected.' +
					'<br/><br/>Tell the producer immediately!';
			} else if (!streamingOBSWebsocketIsConnected) { // eslint-disable-line no-negated-condition
				this.$.cover.innerHTML = 'The streaming OBS is disconnected!<br/>' +
					'Ads cannot be played until it is connected.' +
					'<br/><br/>Tell the producer immediately!';
			} else {
				this.$.cover.hidden = true;
			}
		}
	}

	customElements.define(GdqHostDashboardAds.is, GdqHostDashboardAds);
})();
