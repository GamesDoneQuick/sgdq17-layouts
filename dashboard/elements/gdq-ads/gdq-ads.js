class GdqAds extends Polymer.Element {
	static get is() {
		return 'gdq-ads';
	}

	static get properties() {
		return {};
	}

	start() {
		nodecg.sendMessage('caspar:play', this.filename || 'amb');
	}
}

customElements.define(GdqAds.is, GdqAds);
