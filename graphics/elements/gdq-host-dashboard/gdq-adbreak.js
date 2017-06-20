class GdqAdbreak extends Polymer.MutableData(Polymer.Element) {
	static get is() {
		return 'gdq-adbreak';
	}

	static get properties() {
		return {
			adBreak: {
				type: Object
			}
		};
	}

	start() {
		nodecg.sendMessage('intermissions:startAdBreak', this.adBreak.id);
	}

	complete() {
		nodecg.sendMessage('intermissions:completeAdBreak', this.adBreak.id);
	}

	_calcCompleteButtonHidden(adBreak) {
		const lastAd = adBreak.ads[adBreak.ads.length - 1];
		return lastAd.adType.toLowerCase() !== 'image';
	}
}

customElements.define(GdqAdbreak.is, GdqAdbreak);
