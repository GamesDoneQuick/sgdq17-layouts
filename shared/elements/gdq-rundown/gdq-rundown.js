(function () {
	'use strict';

	const NUM_RUNS_TO_SHOW_IN_RUNDOWN = 4;
	const currentRun = nodecg.Replicant('currentRun');
	const schedule = nodecg.Replicant('schedule');
	const stopwatch = nodecg.Replicant('stopwatch');

	class GdqRundown extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'gdq-rundown';
		}

		static get properties() {
			return {
				schedule: {
					type: Object
				}
			};
		}

		ready() {
			super.ready();
			this._updateScheduleSlice = this._updateScheduleSlice.bind(this);
			currentRun.on('change', this._updateScheduleSlice);
			schedule.on('change', this._updateScheduleSlice);
			stopwatch.on('change', (newVal, oldVal) => {
				if (!oldVal || newVal.state !== oldVal.state || newVal.raw < oldVal.raw) {
					return this._updateScheduleSlice();
				}
			});
		}

		_updateScheduleSlice() {
			if (currentRun.status !== 'declared' ||
				schedule.status !== 'declared' ||
				stopwatch.status !== 'declared') {
				return;
			}

			const currentItems = [currentRun.value];

			// If the timer hasn't started yet, show the previous run's extra content as "current".
			// Else, show the current run's extra content as "current".
			if (stopwatch.value.state === 'stopped' && stopwatch.value.raw <= 0) {
				let foundCurrentRun = false;
				schedule.value.slice(0).reverse().some(item => {
					if (item.id === currentRun.value.id) {
						foundCurrentRun = true;
						return false;
					}

					if (foundCurrentRun) {
						if (item.type === 'run') {
							return true;
						}

						currentItems.unshift(item);
					}

					return false;
				});
			} else {
				let foundCurrentRun = false;
				schedule.value.some(item => {
					if (item.id === currentRun.value.id) {
						foundCurrentRun = true;
						return false;
					}

					if (foundCurrentRun) {
						if (item.type === 'run') {
							return true;
						}

						currentItems.push(item);
					}

					return false;
				});
			}

			// Start after whatever the last item was in currentItems.
			const startIndex = schedule.value.findIndex(item => item.id === currentItems[currentItems.length - 1].id) + 1;
			let numFoundRuns = 0;
			let endIndex = startIndex;
			let lastRunOrder = currentRun.value.order;
			schedule.value.slice(startIndex).some((item, index) => {
				if (numFoundRuns < NUM_RUNS_TO_SHOW_IN_RUNDOWN) {
					if (item.type === 'run') {
						lastRunOrder = item.order;
						numFoundRuns++;
						if (numFoundRuns >= NUM_RUNS_TO_SHOW_IN_RUNDOWN) {
							endIndex = index;
							return false;
						}
					}

					return false;
				} else if (item.type !== 'run' && item.order === lastRunOrder) {
					endIndex = index;
					return false;
				}

				return true;
			});

			this.currentItems = currentItems;
			this.remainderItems = typeof endIndex === 'number' ?
				schedule.value.slice(startIndex, startIndex + endIndex + 1) :
				schedule.value.slice(startIndex);
		}
	}

	customElements.define(GdqRundown.is, GdqRundown);
})();
