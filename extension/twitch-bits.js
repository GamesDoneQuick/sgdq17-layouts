// Packages
const request = require('request-promise');
const TwitchPubSub = require('twitchps');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const BITS_TOTAL_UPDATE_INTERVAL = 10 * 1000;
const log = new nodecg.Logger(`${nodecg.bundleName}:twitch-bits`);
const bitsTotal = nodecg.Replicant('bits:total');

// Optional reconnect, debug options (Defaults: reconnect: true, debug: false)
// var ps = new TwitchPS({init_topics: init_topics});
const pubsub = new TwitchPubSub({
	init_topics: [{ // eslint-disable-line camelcase 
		topic: `channel-bits-events-v1.${nodecg.bundleConfig.twitch.channelId}`,
		token: nodecg.bundleConfig.twitch.oauthToken
	}],
	reconnect: true,
	debug: true
});

pubsub.on('connected', () => {
	log.info('Connected to PubSub.');
});

pubsub.on('disconnected', () => {
	log.warn('Disconnected from PubSub.');
});

pubsub.on('reconnect', () => {
	log.info('Reconnecting to PubSub...');
});

pubsub.on('bits', cheer => {
	log.debug('Received cheer:', cheer);
	nodecg.sendMessage('cheer', cheer);
});

updateBitsTotal();
setInterval(updateBitsTotal, BITS_TOTAL_UPDATE_INTERVAL);

function updateBitsTotal() {
	request({
		method: 'get',
		uri: `https://api.twitch.tv/kraken/channels/${nodecg.bundleConfig.twitch.channelId}?event=sgdq2017`,
		headers: {
			Accept: 'application/vnd.twitchtv.v5+json',
			Authorization: `OAuth ${nodecg.bundleConfig.twitch.oauthToken}`,
			'Client-ID': nodecg.bundleConfig.twitch.clientId,
			'Content-Type': 'application/json'
		},
		json: true
	}).then(res => {
		bitsTotal.value = res.total;
	}).catch(err => {
		log.error('Failed to update bits total:\n\t', err);
	});
}
