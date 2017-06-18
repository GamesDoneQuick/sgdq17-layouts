'use strict';

/// Packages
const cheerio = require('cheerio');
const request = require('request-promise').defaults({jar: true}); // <= Automatically saves and re-uses cookies.

// Ours
const nodecgApiContext = require('./util/nodecg-api-context');

const LOGIN_URL = 'https://private.gamesdonequick.com/tracker/admin/login/';

module.exports = function (nodecg) {
	// Store a reference to this nodecg API context in a place where other libs can easily access it.
	// This must be done before any other files are `require`d.
	nodecgApiContext.set(nodecg);

	if (nodecg.bundleConfig.useMockData) {
		nodecg.log.warn('WARNING! useMockData is true, you will not receive real data from the tracker!');
	}

	require('./obs');
	require('./prizes');
	require('./bids');
	require('./total');
	require('./timekeeping');
	require('./nowplaying');
	require('./countdown');

	// Fetch the login page, and run the response body through cheerio
	// so we can extract the CSRF token from the hidden input field.
	// Then, POST with our username, password, and the csrfmiddlewaretoken.
	request({
		uri: LOGIN_URL,
		transform(body) {
			return cheerio.load(body);
		}
	}).then($ => request({
		method: 'POST',
		uri: LOGIN_URL,
		form: {
			username: nodecg.bundleConfig.tracker.username,
			password: nodecg.bundleConfig.tracker.password,
			csrfmiddlewaretoken: $('#login-form > input[name="csrfmiddlewaretoken"]').val()
		},
		headers: {
			Referer: LOGIN_URL
		},
		resolveWithFullResponse: true,
		simple: false
	})).then(() => {
		require('./schedule');
	}).catch(err => {
		nodecg.log.error('Error authenticating with tracker!\n', err);
	});

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
