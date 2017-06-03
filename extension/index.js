'use strict';

// Ours
const nodecgApiContext = require('./util/nodecg-api-context');

module.exports = function (nodecg) {
	// Store a reference to this nodecg API context in a place where other libs can easily access it.
	// This must be done before any other files are `require`d.
	nodecgApiContext.set(nodecg);

	if (nodecg.bundleConfig.useMockData) {
		nodecg.log.warn('WARNING! useMockData is true, you will not receive real data from the tracker!');
	}

	require('./obs');
	require('./schedule');
	require('./prizes');
	require('./bids');
	require('./total');
	require('./timekeeping');
	require('./advertisements');
	require('./nowplaying');
	require('./countdown');

	if (nodecg.bundleConfig.twitter.userId) {
		require('./twitter');
	} else {
		nodecg.log.warn('"twitter" is not defined in cfg/sgdq17-layouts.json! ' +
			'Twitter integration will be disabled.');
	}

	if (nodecg.bundleConfig.osc.address) {
		require('./osc');
	} else {
		nodecg.log.warn('"osc" is not defined in cfg/sgdq17-layouts.json! ' +
			'Behringer X32 OSC integration will be disabled.');
	}

	if (Object.keys(nodecg.bundleConfig.firebase).length > 0) {
		require('./interview');
	} else {
		nodecg.log.warn('"firebase" is not defined in cfg/sgdq17-layouts.json! ' +
			'The interview question system (Lightning Round) will be disabled.');
	}
};
