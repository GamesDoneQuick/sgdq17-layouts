// Native
const fs = require('fs');
const path = require('path');

// Packages
const clone = require('clone');
const schemaDefaults = require('json-schema-defaults');

// Ours
const caspar = require('./caspar');
const nodecg = require('./util/nodecg-api-context').get();
const obs = require('./obs');
const TimeObject = require('../shared/classes/time-object');

const log = new nodecg.Logger(`${nodecg.bundleName}:intermission`);
const currentIntermission = nodecg.Replicant('currentIntermission');
const currentRun = nodecg.Replicant('currentRun');
const schedule = nodecg.Replicant('schedule');
const stopwatch = nodecg.Replicant('stopwatch');
const schemasPath = path.resolve(__dirname, '../schemas/');
const adBreakSchema = JSON.parse(fs.readFileSync(path.join(schemasPath, 'types/adBreak.json')));
const adSchema = JSON.parse(fs.readFileSync(path.join(schemasPath, 'types/ad.json')));

currentRun.on('change', (newVal, oldVal) => {
	if (!oldVal || newVal.order !== oldVal.order) {
		_updateCurrentIntermissionContent();
	}
});
stopwatch.on('change', (newVal, oldVal) => {
	if (!oldVal ||
		(newVal.state !== oldVal.state && newVal.state === 'stopped') ||
		newVal.raw < oldVal.raw) {
		return _updateCurrentIntermissionContent();
	} else if (newVal.state !== oldVal.state) {
		_updateCurrentIntermissionState();
	}
});
caspar.replicants.files.on('change', () => {
	_updateCurrentIntermissionState();
});

let currentAdBreak = null;
let currentlyPlayingAd = null;
let nextAd = null;
nodecg.listenFor('intermissions:startAdBreak', adBreakId => {
	const adBreak = currentIntermission.value.content.find(item => {
		return item.type === 'adBreak' && item.id === adBreakId;
	});

	if (!adBreak) {
		log.error(`Failed to start ad break: Could not find adBreak ID #${adBreakId} in currentIntermission.`);
		return;
	}

	currentAdBreak = adBreak;

	obs.setCurrentScene('Advertisements').then(() => {
		return playAd(adBreak.ads[0]).then(() => {
			adBreak.state.canStart = false;
			adBreak.state.started = true;
		});
	}).catch(e => {
		log.error('Failed to start ad break:', e);
	});
});

nodecg.listenFor('intermissions:completeAdBreak', adBreakId => {
	const adBreak = currentIntermission.value.content.find(item => {
		return item.type === 'adBreak' && item.id === adBreakId;
	});

	if (!adBreak) {
		log.error(`Failed to complete ad break: Could not find adBreak ID #${adBreakId} in currentIntermission.`);
		return;
	}

	if (adBreak === currentAdBreak) {
		finishCurrentAdBreak();
	} else {
		finishAdBreak(adBreak);
	}
});

nodecg.listenFor('intermissions:completeImageAd', adId => {
	if (!currentlyPlayingAd) {
		log.error(`Tried to mark image ad ID #${adId} as complete, but no ad is currently playing.`);
		return;
	}

	if (adId !== currentlyPlayingAd.id) {
		log.error(`Tried to mark image ad ID #${adId} as complete, but it wasn't the currentlyPlayingAd.`);
		return;
	}

	finishAd(currentlyPlayingAd);

	if (nextAd) {
		playAd(nextAd);
	}
});

caspar.osc.on('foregroundChanged', filename => {
	if (!currentAdBreak) {
		// There will be some cases where this is *not* an error, such as
		// if we play another outro video like the one Bestban made for AGDQ2017.
		// However, this is rare enough that I'm comfortable leaving this as an error log,
		// which will ping me in Slack. - Lange 2017/06/20
		log.error('A video started playing in CasparCG, but no adBreak is active:', filename);
		return;
	}

	if (filename.startsWith('media/')) {
		filename = filename.replace('media/', '');
	}

	let indexOfAdThatJustStarted = -1;
	const adThatJustStarted = currentAdBreak.ads.find((ad, index) => {
		if (ad.filename.toLowerCase() === filename.toLowerCase() && ad.state.completed === false) {
			indexOfAdThatJustStarted = index;
			return true;
		}
		return false;
	});
	if (!adThatJustStarted) {
		currentlyPlayingAd = null;
		log.error('A video started playing in CasparCG, but it did not correspond to any ad in the current adBreak:', filename);
		return;
	}
	currentlyPlayingAd = adThatJustStarted;
	adThatJustStarted.state.started = true;
	adThatJustStarted.state.canStart = false;

	const adThatJustCompleted = indexOfAdThatJustStarted > 0 ?
		currentAdBreak.ads[indexOfAdThatJustStarted - 1] :
		null;
	if (adThatJustCompleted) {
		finishAd(adThatJustCompleted);
	}

	nextAd = currentAdBreak.ads[indexOfAdThatJustStarted + 1];
	let nextAdFilenameNoExt;
	if (nextAd) {
		nextAdFilenameNoExt = path.parse(nextAd.filename).name;
		caspar.loadbgAuto(nextAdFilenameNoExt);
	} else {
		const frameTime = 1000 / adThatJustStarted.state.fps;
		setTimeout(() => {
			if (currentlyPlayingAd.adType.toLowerCase() === 'video') {
				finishCurrentAdBreak();
			} else {
				currentAdBreak.state.canComplete = true;
			}
		}, frameTime * adThatJustStarted.state.durationFrames);
	}

	if (adThatJustStarted.adType.toLowerCase() === 'image') {
		const interval = setInterval(() => {
			adThatJustStarted.state.frameNumber++;
			adThatJustStarted.state.framesLeft =
				adThatJustStarted.state.durationFrames - adThatJustStarted.state.frameNumber;
			if (adThatJustStarted.state.framesLeft <= 0) {
				clearInterval(interval);
				adThatJustStarted.state.canComplete = true;
			}
		}, 1000 / 60);
	}
});

function finishAd(ad) {
	ad.state.started = true;
	ad.state.canStart = false;
	ad.state.completed = true;
	ad.state.canComplete = false;
	ad.state.framesLeft = 0;
	ad.state.frameNumber = ad.state.durationFrames;
}

function finishAdBreak(adBreak) {
	adBreak.state.started = true;
	adBreak.state.canStart = false;
	adBreak.state.completed = true;
	adBreak.state.canComplete = false;
}

function finishCurrentAdBreak() {
	caspar.clear();
	finishAd(currentlyPlayingAd);
	finishAdBreak(currentAdBreak);
	currentAdBreak = null;
	currentlyPlayingAd = null;
	obs.setCurrentScene('Break').catch(e => {
		log.error('Failed to set scene back to "Break" after completing ad break:', e);
	});
}

caspar.osc.on('frameChanged', (currentFrame, durationFrames) => {
	if (currentlyPlayingAd && currentlyPlayingAd.adType.toLowerCase() === 'video') {
		currentlyPlayingAd.state.frameNumber = currentFrame;
		currentlyPlayingAd.state.framesLeft = durationFrames - currentFrame;
	}
});

function playAd(ad) {
	const adFilenameNoExt = path.parse(ad.filename).name;
	return caspar.play(adFilenameNoExt).then(() => {
		ad.state.started = true;
		ad.state.canStart = false;
	});
}

/**
 * Sets the `preOrPost` and `content` properties of the currentIntermission replicant.
 * @returns {undefined}
 * @private
 */
function _updateCurrentIntermissionContent() {
	if (!currentRun.value || !stopwatch.value || !schedule.value) {
		return;
	}

	// If the timer hasn't started yet, use the intermission between the previous run and currentRun.
	// Else, use the intermission between currentRun and nextRun.
	currentIntermission.value = {
		preOrPost: hasRunStarted() ? 'post' : 'pre',
		content: calcIntermissionContent()
	};

	_updateCurrentIntermissionState();
}

/**
 * Updates the `state` property of individual content items within the currentIntermission replicant.
 * @returns {undefined}
 * @private
 */
function _updateCurrentIntermissionState() {
	if (!currentIntermission.value || !caspar.replicants.files.value) {
		return;
	}

	let allPriorAdBreaksAreComplete = true;
	currentIntermission.value.content.forEach(item => {
		if (item.type === 'adBreak') {
			if (!item.state.completed && !item.state.started && !hasRunStarted() && allPriorAdBreaksAreComplete) {
				item.state.canStart = true;
			} else {
				item.state.canStart = false;
			}

			if (!item.state.completed) {
				allPriorAdBreaksAreComplete = false;
			}

			item.ads.forEach(ad => {
				const casparFile = caspar.replicants.files.value.find(file => {
					const adFilenameNoExt = path.parse(ad.filename).name;
					return file.name.toLowerCase() === adFilenameNoExt.toLowerCase();
				});

				if (!casparFile) {
					log.error(`Ad points to file that does not exist in CasparCG: ${ad.filename}`);
					return;
				}

				if (casparFile.type.toLowerCase() === 'video') {
					ad.state.durationFrames = casparFile.frames;
					ad.state.fps = casparFile.frameRate;
				} else if (casparFile.type.toLowerCase() === 'image') {
					ad.state.durationFrames = TimeObject.parseSeconds(ad.duration) * 60;
					ad.state.fps = 60;
				} else {
					log.error('Unexpected file type from CasparCG:', casparFile);
				}
			});
		}
	});
}

/**
 * Calculates what the contents of `currentIntermission` should be based on the values of
 * `currentRun`, `schedule`, and whether the currentRun has started or not.
 * @returns {Array<Object>} - The intermission content.
 */
function calcIntermissionContent() {
	const preOrPost = hasRunStarted() ? 'post' : 'pre';
	const intermissionContent = [];
	const scheduleContent = preOrPost === 'pre' ?
		schedule.value.slice(0).reverse() :
		schedule.value;

	let foundCurrentRun = false;
	scheduleContent.some(item => {
		if (item.id === currentRun.value.id) {
			foundCurrentRun = true;
			return false;
		}

		if (foundCurrentRun) {
			if (item.type === 'run') {
				return true;
			}

			const clonedItem = clone(item);
			if (item.type === 'adBreak') {
				clonedItem.state = schemaDefaults(adBreakSchema.properties.state);
				clonedItem.ads.forEach(ad => {
					ad.state = schemaDefaults(adSchema.properties.state);
				});
			}
			intermissionContent.push(clonedItem);
		}

		return false;
	});

	return preOrPost === 'pre' ? intermissionContent.reverse() : intermissionContent;
}

/**
 * Returns true if the current run has begun, false otherwise.
 * @returns {boolean} - Whether or not the current run has started.
 */
function hasRunStarted() {
	return stopwatch.value.raw > 0 || stopwatch.value.state !== 'stopped';
}
