#!/usr/bin/env node
'use strict';

import DownloadChromium from 'download-chromium';
import path from 'path';

let nextProgress = {
	values: {percent:0,transferred:0,total:0},
	pending: null
};
function onProgress (values) {
	values.percent = Math.floor(values.percent*100);
	let oldvalues = nextProgress.values;
	nextProgress.values = values;
	if(nextProgress.pending) return;

	function tick(){
		let values = nextProgress.values;
		if(values.percent-oldvalues.percent || values.transferred === values.total){
			console.log(`progress: ${values.percent}% (transferred ${values.transferred} out of ${values.total})`);
			nextProgress.pending = null;
		}
		else{
			nextProgress.pending = setTimeout(tick,100);
		}
	}
	tick();
}

async function main(){
	let chromium = {
		platform: 'linux',
		revision: '938248',
		log: true,
		onProgress,
		installPath: path.resolve('build/chromium')
	};
	chromium = await DownloadChromium(chromium);
	console.log(chromium);
}

try{
	main();
}
catch(err){
	console.error(err);
	process.exit(1);
}