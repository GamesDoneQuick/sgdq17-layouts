(function () {
	'use strict';

	const total = nodecg.Replicant('total');
	const autoUpdateTotal = nodecg.Replicant('autoUpdateTotal');

	class GdqTotal extends Polymer.Element {
		static get is() {
			return 'gdq-total';
		}

		static get properties() {
			return {
				total: {
					type: String,
					value: '?'
				}
			};
		}

		ready() {
			super.ready();
			total.on('change', newVal => {
				this.total = newVal.formatted;
			});
			autoUpdateTotal.on('change', newVal => {
				this.autoUpdateTotal = newVal;
			});
		}

		edit() {
			this.$.editTotalInput.value = total.value.raw;
			this.$.editDialog.open();
		}

		_handleAutoUpdateToggleChange(e) {
			autoUpdateTotal.value = e.target.checked;
		}

		_handleEditDialogConfirmed() {
			nodecg.sendMessage('setTotal', parseFloat(this.$.editTotalInput.value));
		}
	}

	customElements.define(GdqTotal.is, GdqTotal);
})();
