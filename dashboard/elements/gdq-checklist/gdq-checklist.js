(function () {
	'use strict';

	const checklist = nodecg.Replicant('checklist');

	class GdqChecklist extends Polymer.Element {
		static get is() {
			return 'gdq-checklist';
		}

		ready() {
			super.ready();
			checklist.on('change', newVal => {
				newVal = JSON.parse(JSON.stringify(newVal));
				this.extraContent = newVal.extraContent;
				this.techStationDuties = newVal.techStationDuties;
				this.otherDuties = newVal.otherDuties;
			});

			this._checkboxChanged = this._checkboxChanged.bind(this);
			this.addEventListener('change', this._checkboxChanged);
		}

		_checkboxChanged(e) {
			const category = e.target.getAttribute('category');
			const name = e.target.innerText.trim();
			checklist.value[category].find(task => {
				if (task.name === name) {
					task.complete = e.target.checked;
					return true;
				}

				return false;
			});
		}
	}

	customElements.define(GdqChecklist.is, GdqChecklist);
})();
