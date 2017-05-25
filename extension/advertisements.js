'use strict';

// Native
const format = require('util').format;
const fs = require('fs');

// NodeCG
const singleInstance = require('../../../lib/graphics/single_instance');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const currentRun = nodecg.Replicant('currentRun');
const playingAd = nodecg.Replicant('playingAd', {defaultValue: false, persistent: false});
const adPageOpen = nodecg.Replicant('adPageOpen', {defaultValue: false, persistent: false});

singleInstance.on('graphicAvailable', url => {
	if (url === `/graphics/${nodecg.bundleName}/advertisements.html`) {
		adPageOpen.value = false;
		playingAd.value = false;
	}
});

nodecg.listenFor('logAdPlay', ad => {
	const logStr = format('%s, %s, %s, %s\n',
		new Date().toISOString(), ad.base, currentRun.value.name);

	fs.appendFile('logs/ad_log.csv', logStr, err => {
		if (err) {
			nodecg.log.error('[advertisements] Error appending to log:', err.stack);
		}
	});
});
