'use strict';

// Native
const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');

// Packages
const OBSUtility = require('nodecg-utility-obs');

// Ours
const nodecg = require('./util/nodecg-api-context').get();

// We track what _layout_ is active, not necessarily what _scene_ is active.
// A given layout can be on multiple scenes.
const currentLayout = nodecg.Replicant('gdq:currentLayout', {defaultValue: ''});
const obs = new OBSUtility(nodecg);

const uploadScriptPath = nodecg.bundleConfig.youtubeUploadScriptPath;
if (uploadScriptPath) {
	let stats;
	try {
		stats = fs.lstatSync(uploadScriptPath);
	} catch (e) {
		if (e.code === 'ENOENT') {
			throw new Error(`Configured youtubeUploadScriptPath (${uploadScriptPath}) does not exist.`);
		} else {
			throw e;
		}
	}

	if (!stats.isFile()) {
		throw new Error(`Configured youtubeUploadScriptPath (${uploadScriptPath}) is not a file.`);
	}

	nodecg.log.info('Automatic VOD uploading enabled.');
}

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
		/* obs.send('ResetCropping').catch(error => {
			console.log('resetCropping error:', error);
		}); */
	},

	async cycleRecordings() {
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Timed out waiting for OBS to stop recording.'));
			}, 10000);

			const listener = () => {
				obs.log.info('Recording stopped.');
				clearTimeout(timeout);
				resolve();
			};

			obs.once('RecordingStopped', listener);
			obs.stopRecording().catch(error => {
				if (error.error === 'recording not active') {
					obs.removeListener('RecordingStopped', listener);
					resolve();
				} else {
					obs.log.error(error);
					reject(error);
				}
			});
		});

		await obs.startRecording();
		obs.log.info('Recording started.');

		if (uploadScriptPath) {
			nodecg.log.info('Executing upload script...');
			exec(`python "${uploadScriptPath}"`, {
				cwd: path.parse(uploadScriptPath).dir
			}, (error, stdout, stderr) => {
				if (error) {
					nodecg.log.error('Upload script failed:', error);
					return;
				}

				if (stderr) {
					nodecg.log.error('Upload script failed:', stderr);
					return;
				}

				if (stdout.trim().length > 0) {
					nodecg.log.info('Upload script ran successfully:', stdout.trim());
				} else {
					nodecg.log.info('Upload script ran successfully.');
				}
			});
		}
	},

	get connected() {
		return obs._connected;
	}
};
