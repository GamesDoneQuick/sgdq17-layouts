# sgdq17-layouts [![CircleCI](https://circleci.com/gh/GamesDoneQuick/sgdq17-layouts.svg?style=svg&circle-token=f69384637611ff362b50e9023c57a6728ee20900)](https://circleci.com/gh/GamesDoneQuick/sgdq17-layouts)
The on-stream graphics used during Awesome Games Done Quick 2017.

This is a [NodeCG](http://github.com/nodecg/nodecg) 0.8 bundle. You will need to have NodeCG 0.8 installed to run it.

## Video Breakdown
[![screenshot](https://i.imgur.com/aVCCgYZ.png)
A twelve-part video series explaining the structure and function of this NodeCG bundle. 
The final videos in the series also walk through the setup process.](https://www.youtube.com/watch?v=vBAZXchbI3U&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx)

## Installation
- Install to `nodecg/bundles/sgdq17-layouts`.
- Install `bower` if you have not already (`npm install -g bower`)
- **WINDOWS**: Install [`windows-build-tools`](https://www.npmjs.com/package/windows-build-tools) to install the tools necessary to compile `sgdq17-layouts`' dependencies.
- **LINUX**: Install `build-essential` and Python 2.7, which are needed to compile `sgdq17-layouts`' dependencies.
- `cd nodecg/bundles/sgdq17-layouts` and run `npm install --production`, then `bower install`
- Create the configuration file (see the [configuration][id] section below for more details)
- Run the nodecg server: `nodecg start` (or `node index.js` if you don't have nodecg-cli) from the `nodecg` root directory.

Please note that you **must manually run `npm install` for this bundle**. NodeCG currently cannot reliably 
compile this bundle's npm dependencies. This is an issue we hope to address in the future.

**Please note that by default, the break screen graphic will not work.** This is because this graphic uses
a paid library called [SplitText](https://greensock.com/SplitText), which we cannot redistribute. If you wish to use the break screen with its current implementation, you will need to pay for access to SplitText and save a copy to `graphics/imports/SplitText.min.js`.

## Usage
This bundle is not intended to be used verbatim. Some of the assets have been replaced with placeholders, and
most of the data sources are hardcoded. We are open-sourcing this bundle in hopes that people will use it as a
learning tool and base to build from, rather than just taking and using it wholesale in their own productions.

To reiterate, please don't just download and use this bundle as-is. Build something new from it.

### Running a mock donation server.
`sgdq17-layouts` breaks from previous GDQ layout bundles in that it listens for donations in realtime,
rather than polling the donation tracker for a new donation total once a minute. To facilitate testing,
we provide a small script that sends mock donations:

1. Add `"donationSocketUrl": "http://localhost:22341"` to your `nodecg/cfg/sgdq17-layouts.json`
2. From the `nodecg/bundles/sgdq17-layouts` folder, run `npm run mock-donations`
3. Run NodeCG (`nodecg start` or `node index.js` from the `nodecg` folder)

### Lightning Round
[Lightning Round](https://github.com/GamesDoneQuick/lightning-round) is a new system we made for SGDQ 2017 for gathering interview questions from Twitter. It exists in two parts: one part running "in the cloud" as a Firebase app, and one part running locally as part of this NodeCG bundle. For more information, watch these videos:
- [Lightning Round Overview](https://www.youtube.com/watch?v=-qzIfS7KxCQ&index=4&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx)
- [Lightning Round Setup Guide](https://www.youtube.com/watch?v=Uz_99-bJzyc&index=12&list=PLTEhlYdONYxv1wk2FsIpEz92X3x2E7bSx)

[id]: configuration
## Configuration
To configure this bundle, create and edit `nodecg/cfg/sgdq17-layouts.json`.  
Refer to [configschema.json][] for the structure of this file.
[configschema.json]: configschema.json

Example config:
```json
{
	"useMockData": true,
	"displayDuration": 10,
	"osc": {
		"address": "192.168.1.10",
		"gameAudioChannels": [
			{
				"sd": 17,
				"hd": 25
			},
			{
				"sd": 19,
				"hd": 27
			},
			{
				"sd": 21,
				"hd": null
			},
			{
				"sd": 23,
				"hd": null
			}
		]
	},
	"twitter": {
		"userId": "1234",
		"consumerKey": "aaa",
		"consumerSecret": "bbb",
		"accessTokenKey": "ccc",
		"accessTokenSecret": "ddd"
	},
	"enableTimerSerial": false,
	"streamTitle": "EVENT NAME - ${gameName}",
	"footpedal": {
		"enabled": false,
		"buttonId": 31
	},
	"obsWebsocket": {
		"address": "localhost",
		"password": "your_password"
	},
	"firebase": {
		"databaseURL": "https://your-firebase-app.firebaseio.com",
		"paste": "your",
		"firebase": "credentials",
		"into": "here"
	}
}
```

## Troubleshooting
### I hear crackling in my USB audio devices when running sgdq17-layouts
This can happen when `footpedal.enabled` is set to `true` in your `nodecg/cfg/sgdq17-layouts`.
The underlying code polls USB devices every 500ms, and on some devices this polling can cause crackling.
To fix the crackling, set `footpedal.enabled` back to `false`. This unfortunately does mean that you will be unable
to use the footpedal functionality.

### The break screen graphic doesn't work, and throws errors in the console.
This is because the break screen graphic uses a paid library called [SplitText](https://greensock.com/SplitText), 
which we cannot redistribute. If you wish to use the break screen, you will need to pay for access to SplitText and 
save a copy to `graphics/imports/SplitText.min.js`.

## License
sgdq17-layouts is provided under the Apache v2 license, which is available to read in the [LICENSE][] file.
[license]: LICENSE

### Credits
Designed & developed by [Support Class](http://supportclass.net/)
 - [Alex "Lange" Van Camp](https://twitter.com/VanCamp/)  
 - [Chris Hanel](https://twitter.com/ChrisHanel)
