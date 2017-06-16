'use strict';

// Packages
const OBSUtility = require('nodecg-utility-obs');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

// We track what _layout_ is active, not necessarily what _scene_ is active.
// A given layout can be on multiple scenes.
const currentLayout = nodecg.Replicant('gdq:currentLayout', {defaultValue: ''});
const obs = new OBSUtility(nodecg);

obs.replicants.programScene.on('change', newVal => {
	if (!newVal) {
		return;
	}

	newVal.sources.some(source => {
		if (!source.name) {
			return false;
		}

		const lowercaseSourceName = source.name.toLowerCase();
		if (lowercaseSourceName.indexOf('layout') === 0) {
			currentLayout.value = lowercaseSourceName.replace(/ /g, '_').replace('layout_', '');
			return true;
		}

		return false;
	});
});

module.exports = {
	resetCropping() {
		obs.send('ResetCropping').catch(error => {
			console.log('resetCropping error:', error);
		});
	},

	async cycleRecordings() {
		console.log('cycling recordings');
		try {
			await obs.stopRecording();
		} catch (error) {
			if (error.error !== 'recording not active') {
				obs.log.error(error);
			}
		}

		await obs.startRecording();
	},

	get connected() {
		return obs._connected;
	}
};
