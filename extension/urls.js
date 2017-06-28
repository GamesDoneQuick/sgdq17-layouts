'use strict';

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const EVENT_ID = 20;
const OFFLINE_CONFIG = nodecg.bundleConfig.offline;
const MOCK_URLS = {
	ads: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/ads.json',
	allBids: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/allBids.json',
	allPrizes: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/allPrizes.json',
	currentBids: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/currentBids.json',
	currentPrizes: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/currentPrizes.json',
	interviews: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/interviews.json',
	runners: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/runners.json',
	runs: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/schedule.json',
	total: 'https://dl.dropboxusercontent.com/u/6089084/gdq_mock/total.json'
};

const PRODUCTION_URLS = {
	ads: `https://private.gamesdonequick.com/tracker/gdq/ads/${EVENT_ID}/`,
	allBids: `https://gamesdonequick.com/tracker/search/?type=allbids&event=${EVENT_ID}`,
	allPrizes: `https://gamesdonequick.com/tracker/search/?type=prize&event=${EVENT_ID}`,
	currentBids: `https://gamesdonequick.com/tracker/search/?type=allbids&feed=current&event=${EVENT_ID}`,
	currentPrizes: `https://gamesdonequick.com/tracker/search/?type=prize&feed=current&event=${EVENT_ID}`,
	interviews: `https://private.gamesdonequick.com/tracker/gdq/interviews/${EVENT_ID}/`,
	runners: `https://private.gamesdonequick.com/tracker/search?type=runner&event=${EVENT_ID}`,
	runs: `https://private.gamesdonequick.com/tracker/search?type=run&event=${EVENT_ID}`,
	total: `https://gamesdonequick.com/tracker/${EVENT_ID}?json`
};

module.exports = {
	get(name) {
		if (OFFLINE_CONFIG.enabled) {
			return OFFLINE_CONFIG[name];
		} else if (nodecg.bundleConfig.useMockData) {
			return MOCK_URLS[name];
		}

		return PRODUCTION_URLS[name];
	}
};
