(function () {
	'use strict';

	const autoCycleRecordings = nodecg.Replicant('autoCycleRecordings');

	class GdqRecordings extends Polymer.Element {
		static get is() {
			return 'gdq-recordings';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();
			Polymer.RenderStatus.beforeNextRender(this, () => {
				autoCycleRecordings.on('change', newVal => {
					this.$.toggle.checked = newVal;
				});
			});
		}

		_handleToggleChange(e) {
			autoCycleRecordings.value = e.target.checked;
		}
	}

	customElements.define(GdqRecordings.is, GdqRecordings);
})();
