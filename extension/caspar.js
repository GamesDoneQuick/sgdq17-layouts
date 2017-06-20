'use strict';

// Native
const EventEmitter = require('events');

// Packages
const equals = require('deep-equal');
const osc = require('osc');
const {CasparCG, Enum: CasparEnum} = require('casparcg-connection');
const debounce = require('lodash.debounce');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const log = new nodecg.Logger(`${nodecg.bundleName}:caspar`);
const files = nodecg.Replicant('caspar:files');
const connection = new CasparCG({
	host: nodecg.bundleConfig.casparcg.host,
	port: nodecg.bundleConfig.casparcg.port,
	onConnected() {
		log.info('Connected.');
		connection.lock(1, CasparEnum.Lock.ACQUIRE, nodecg.bundleConfig.casparcg.lockSecret).then(() => {
			log.info('Lock acquired.');
		}).catch(e => {
			log.error('Failed to acquire lock:', e);
		});
	},
	onDisconnected() {
		log.warn('Disconnected.');
	},
	onLog(str) {
		log.debug(str);
	},
	onError(error) {
		log.error(error);
	}
});

updateFiles();
setInterval(updateFiles, 60000);

module.exports = {
	play(filename) {
		log.info('Playing %s...', filename);
		return connection.play(1, undefined, filename);
	},
	info() {
		return connection.info(1);
	},
	loadbgAuto(filename) {
		return connection.loadbgAuto(1, undefined, filename, false, CasparEnum.Transition.CUT);
	},
	clear() {
		return connection.clear(1);
	},
	stop() {
		return connection.stop(1);
	},
	replicants: {
		files
	},
	osc: new EventEmitter()
};

nodecg.listenFor('caspar:play', module.exports.play);

const udpPort = new osc.UDPPort({
	localAddress: '0.0.0.0',
	localPort: nodecg.bundleConfig.casparcg.localOscPort,
	metadata: true
});

let foregroundFileName = '';
let currentFrame = 0;
let durationFrames = 0;
let fileMayHaveRestarted = false;

const emitForegroundChanged = debounce(() => {
	module.exports.osc.emit('foregroundChanged', foregroundFileName);
}, 1000 / 60);

udpPort.on('message', message => {
	if (message.address === '/channel/1/stage/layer/0/file/frame') {
		const newCurrentFrame = message.args[0].value.low;
		const newDurationFrames = message.args[1].value.low;
		if (currentFrame !== newCurrentFrame || durationFrames !== newDurationFrames) {
			if (newCurrentFrame < currentFrame) {
				process.nextTick(() => {
					fileMayHaveRestarted = true;
				});
			}
			currentFrame = newCurrentFrame;
			durationFrames = newDurationFrames;
			module.exports.osc.emit('frameChanged', currentFrame, durationFrames);
		}
	} else if (message.address === '/channel/1/stage/layer/0/file/path') {
		const fileChanged = message.args[0].value !== foregroundFileName;
		if (fileChanged || fileMayHaveRestarted) {
			foregroundFileName = message.args[0].value;
			emitForegroundChanged();
		}

		fileMayHaveRestarted = false;
	}
});

udpPort.on('error', error => {
	log.warn('[osc] Error:', error.stack);
});

udpPort.on('open', () => {
	log.info('[osc] Port open, can now receive events from CasparCG.');
});

udpPort.on('close', () => {
	log.warn('[osc] Port closed.');
});

// Open the socket.
udpPort.open();

/**
 * Updates the caspar:files replicant.
 * @returns {undefined}
 */
function updateFiles() {
	connection.cls().then(reply => {
		if (equals(reply.response.data, files.value)) {
			return;
		}

		files.value = reply.response.data;
	}).catch(e => {
		log.error('Error updating files:', e);
	});
}
