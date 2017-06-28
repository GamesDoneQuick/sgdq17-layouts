'use strict';

// Packages
const equal = require('deep-equal');
const numeral = require('numeral');
const Q = require('q');
const request = require('request');

// Ours
const nodecg = require('./util/nodecg-api-context').get();
const gdqUrls = require('./urls');

const POLL_INTERVAL = 60 * 1000;
const BIDS_URL = gdqUrls.get('allBids');
const CURRENT_BIDS_URL = gdqUrls.get('currentBids');
const currentBids = nodecg.Replicant('currentBids', {defaultValue: []});
const allBids = nodecg.Replicant('allBids', {defaultValue: []});
const bitsTotal = nodecg.Replicant('bits:total');

// Get latest bid data every POLL_INTERVAL milliseconds
nodecg.log.info('Polling bids every %d seconds...', POLL_INTERVAL / 1000);
update();

/**
 * Grabs the latest bids from the Tracker.
 * @returns {Promise} - A Q.all promise.
 */
function update() {
	nodecg.sendMessage('bids:updating');

	const currentPromise = Q.defer();
	request(CURRENT_BIDS_URL, (err, res, body) => {
		handleResponse(err, res, body, currentPromise, {
			label: 'current bids',
			replicant: currentBids
		});
	});

	const allPromise = Q.defer();
	request(BIDS_URL, (err, res, body) => {
		handleResponse(err, res, body, allPromise, {
			label: 'all bids',
			replicant: allBids
		});
	});

	return Q.all([
		currentPromise.promise,
		allPromise.promise
	]).fin(() => {
		nodecg.sendMessage('bids:updated');
		setTimeout(update, POLL_INTERVAL);
	});
}

/**
 * A kind of weird and slightly polymorphic function to handle the various responses from the tracker that we receive.
 * @param {Error} [error] - The error (if any) encountered during the request.
 * @param {Object} response - The request response.
 * @param {Object} body - The request body.
 * @param {Object} deferred - A deferred promise object.
 * @param {Object} opts - Options.
 * @returns {undefined}
 */
function handleResponse(error, response, body, deferred, opts) {
	if (error || response.statusCode !== 200) {
		let msg = `Could not get ${opts.label}, unknown error`;
		if (error) {
			msg = `Could not get ${opts.label}:\n${error.message}`;
		} else if (response) {
			msg = `Could not get ${opts.label}, response code ${response.statusCode}`;
		}
		nodecg.log.error(msg);
		deferred.reject(msg);
		return;
	}

	let bids;
	try {
		bids = JSON.parse(body);
	} catch (e) {
		nodecg.log.error(e.stack);
		deferred.reject(e);
		return;
	}

	// The response from the tracker is flat. This is okay for donation incentives, but it requires
	// us to do some extra work to figure out what the options are for donation wars that have multiple
	// options.
	const parentBidsById = {};
	const childBids = [];
	let bitsIncentiveTotalOffset = 0;
	bids.sort(sortBidsByEarliestEndTime).forEach(bid => {
		// If this bid is an option for a donation war, add it to childBids array.
		// Else, add it to the parentBidsById object.
		if (bid.fields.parent) {
			childBids.push(bid);
		} else {
			// Format the bid to clean up unneeded cruft.
			const formattedParentBid = {
				id: bid.pk,
				name: bid.fields.name,
				description: bid.fields.shortdescription || `No shortdescription for bid #${bid.pk}`,
				total: numeral(bid.fields.total).format('$0,0[.]00'),
				rawTotal: parseFloat(bid.fields.total),
				state: bid.fields.state,
				speedrun: bid.fields.speedrun__name,
				speedrunEndtime: Date.parse(bid.fields.speedrun__endtime),
				public: bid.fields.public,

				// Green Hill Zone Blindfolded or Blindfolded Majora? Then this is a bits challenge.
				isBitsChallenge: Boolean(bid.pk === 5788 || bid.pk === 5831)
			};

			// If this parent bid is not a target, that means it is a donation war that has options.
			// So, we should add an options property that is an empty array,
			// which we will fill in the next step.
			// Else, add the "goal" field to the formattedParentBid.
			if (bid.fields.istarget === false) {
				formattedParentBid.options = [];
			} else {
				const goal = parseFloat(bid.fields.goal);
				formattedParentBid.goalMet = bid.fields.total >= bid.fields.goal;
				if (formattedParentBid.isBitsChallenge) {
					formattedParentBid.goal = numeral(goal * 100).format('0,0');
					formattedParentBid.rawGoal = parseFloat(goal * 100);
					formattedParentBid.rawTotal = Math.min(bitsTotal.value - bitsIncentiveTotalOffset, formattedParentBid.rawGoal);
					formattedParentBid.total = numeral(formattedParentBid.rawTotal).format('0,0');
					formattedParentBid.goalMet = formattedParentBid.rawTotal >= formattedParentBid.rawGoal;
					bitsIncentiveTotalOffset += formattedParentBid.rawTotal;
				} else {
					formattedParentBid.goal = numeral(goal).format('$0,0[.]00');
					formattedParentBid.rawGoal = goal;
				}
			}

			parentBidsById[bid.pk] = formattedParentBid;
		}
	});

	// Now that we have a big array of all child bids (i.e., donation war options), we need
	// to assign them to their parents in the parentBidsById object.
	childBids.forEach(bid => {
		const formattedChildBid = {
			id: bid.pk,
			parent: bid.fields.parent,
			name: bid.fields.name,
			description: bid.fields.shortdescription,
			total: numeral(bid.fields.total).format('$0,0[.]00'),
			rawTotal: parseFloat(bid.fields.total)
		};

		const parent = parentBidsById[bid.fields.parent];
		if (parent) {
			parentBidsById[bid.fields.parent].options.push(formattedChildBid);
		} else {
			nodecg.log.error('Child bid #%d\'s parent (bid #%s) could not be found.' +
				' This child bid will be discarded!', bid.pk, bid.fields.parent);
		}
	});

	// Ah, but now we have to sort all these child bids by how much they have raised so far!
	// While we're at it, map all the parent bids back onto an array and set their "type".
	let bidsArray = [];
	for (const id in parentBidsById) {
		if (!{}.hasOwnProperty.call(parentBidsById, id)) {
			continue;
		}

		const bid = parentBidsById[id];
		bid.type = (function () {
			if (bid.options) {
				if (bid.options.length === 2) {
					return 'choice-binary';
				}

				return 'choice-many';
			}

			return 'challenge';
		})();

		bidsArray.push(bid);

		if (!bid.options) {
			continue;
		}

		bid.options = bid.options.sort((a, b) => {
			const aTotal = a.rawTotal;
			const bTotal = b.rawTotal;
			if (aTotal > bTotal) {
				return -1;
			}
			if (aTotal < bTotal) {
				return 1;
			}
			// a must be equal to b
			return 0;
		});
	}

	// Yes, we need to now sort again.
	bidsArray = bidsArray.sort(sortBidsByEarliestEndTime);

	// After all that, deep-compare our newly-calculated parentBidsById object against the existing value.
	// Only assign the replicant if it's actually different.
	if (equal(bidsArray, opts.replicant.value)) {
		deferred.resolve(false);
	} else {
		opts.replicant.value = bidsArray;
		deferred.resolve(true);
	}
}

function sortBidsByEarliestEndTime(a, b) {
	// Raw format from tracker.
	if (a.fields && b.fields) {
		return Date.parse(a.fields.speedrun__endtime) - Date.parse(b.fields.speedrun__endtime);
	}

	// Else, format from our own code.
	return a.speedrunEndtime - b.speedrunEndtime;
}
