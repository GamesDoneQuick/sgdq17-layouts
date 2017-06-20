(function () {
	'use strict';

	const currentIntermission = nodecg.Replicant('currentIntermission');

	class GdqHostDashboardAds extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-host-dashboard-ads';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();
			currentIntermission.on('change', newVal => {
				this.content = newVal.content;
			});
		}

		equal(a, b) {
			return a === b;
		}
	}

	customElements.define(GdqHostDashboardAds.is, GdqHostDashboardAds);
})();
