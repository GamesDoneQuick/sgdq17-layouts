'use strict';

module.exports = function (nodecg) {
	if (nodecg.bundleConfig.useMockData) {
		nodecg.log.warn('WARNING! useMockData is true, you will not receive real data from the tracker!');
	}

	// Must be before schedule. Well, I mean I guess it'd be okay if it wasn't, but whatever.
	try {
		require('./obs-websocket')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "obs-websocket" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./schedule')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "schedule" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./prizes')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "prizes" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./bids')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "bids" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./total')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "total" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./timekeeping')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "timekeeping" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./advertisements')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "advertisements" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./twitter')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "twitter" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./osc')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "osc" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./interview')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "interview" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./nowplaying')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "nowplaying" lib:', e.stack);
		process.exit(1);
	}

	try {
		require('./countdown')(nodecg);
	} catch (e) {
		nodecg.log.error('Failed to load "countdown" lib:', e.stack);
		process.exit(1);
	}
};
