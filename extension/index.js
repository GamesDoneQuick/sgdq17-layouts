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

	try {
		require('./obs');
	} catch (e) {
		nodecg.log.error('Failed to load "obs" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./schedule');
	} catch (e) {
		nodecg.log.error('Failed to load "schedule" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./prizes');
	} catch (e) {
		nodecg.log.error('Failed to load "prizes" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./bids');
	} catch (e) {
		nodecg.log.error('Failed to load "bids" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./total');
	} catch (e) {
		nodecg.log.error('Failed to load "total" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./timekeeping');
	} catch (e) {
		nodecg.log.error('Failed to load "timekeeping" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./advertisements');
	} catch (e) {
		nodecg.log.error('Failed to load "advertisements" lib:', e.stack);
		process.exit(1);
	}

	if (nodecg.bundleConfig.twitter.userId) {
		try {
			require('./twitter');
		} catch (e) {
			nodecg.log.error('Failed to load "twitter" lib:', e.stack);
			process.exit(1);
		}
	} else {
		nodecg.log.error('"twitter" is not defined in cfg/sgdq17-layouts.json! ' +
			'Twitter integration will be disabled.');
	}

	if (nodecg.bundleConfig.osc.address) {
		try {
			require('./osc');
		} catch (e) {
			nodecg.log.error('Failed to load "osc" lib:', e.stack);
			process.exit(1);
		}
	} else {
		nodecg.log.error('"osc" is not defined in cfg/sgdq17-layouts.json! ' +
			'Behringer X32 OSC integration will be disabled.');
	}

	if (Object.keys(nodecg.bundleConfig.firebase).length === 0) {
		nodecg.log.error('"firebase" is not defined in cfg/sgdq17-layouts.json! ' +
			'The interview question system (Lightning Round) will be disabled.');
	} else {
		try {
			require('./interview');
		} catch (e) {
			nodecg.log.error('Failed to load "interview" lib:', e.stack);
			process.exit(1);
		}
	}

	try {
		require('./nowplaying');
	} catch (e) {
		nodecg.log.error('Failed to load "nowplaying" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./countdown');
	} catch (e) {
		nodecg.log.error('Failed to load "countdown" lib:', e.stack);
		process.exit(1);
	}
};
