'use strict';

// Native
const EventEmitter = require('events');
const fs = require('fs');
const format = require('util').format;

// Packages
const equals = require('deep-equal');
const osc = require('osc');
const {CasparCG, Enum: CasparEnum} = require('casparcg-connection');
const debounce = require('lodash.debounce');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

const log = new nodecg.Logger(`${nodecg.bundleName}:caspar`);
const currentRun = nodecg.Replicant('currentRun');
const files = nodecg.Replicant('caspar:files');
const connected = nodecg.Replicant('caspar:connected');
const connection = new CasparCG({
	host: nodecg.bundleConfig.casparcg.host,
	port: nodecg.bundleConfig.casparcg.port,
	autoReconnect: true,
	autoReconnectInterval: true,
	autoReconnectAttempts: Infinity,
	onConnected() {
		connected.value = true;
		log.info('Connected.');
		connection.lock(1, CasparEnum.Lock.ACQUIRE, nodecg.bundleConfig.casparcg.lockSecret).then(() => {
			log.info('Lock acquired.');
		}).catch(e => {
			log.error('Failed to acquire lock:', e);
			connected.value = false;
		});
	},
	onDisconnected() {
		connected.value = false;
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
setInterval(checkConnection, 1000);

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
	const logStr = format('%s, %s, %s\n',
		new Date().toISOString(), foregroundFileName, currentRun.value.name);

	log.info('Ad play:', logStr.replace('\n', ''));
	fs.appendFile('logs/ad_log.csv', logStr, err => {
		if (err) {
			nodecg.log.error('[advertisements] Error appending to log:', err.stack);
		}
	});

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

function checkConnection() {
	connection.info().catch(e => {
		log.error('Error checking connection:', e);
	});
}
