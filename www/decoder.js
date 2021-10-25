/*
https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
*/
export {
	Decode as default
};

import SplitHeader from "./lib/splitheader.js";
import * as b45 from './lib/base45.js';

const state = {
	video: null
};

async function getMonitorSource(){
	if(state.video) return state.video;
	state.video = await navigator.mediaDevices.getDisplayMedia();
	return state.video;
}

async function Decode(){
	let stylesheet = document.createElement('link');
	stylesheet.setAttribute('rel','stylesheet');
	stylesheet.setAttribute('type','text/css');
	stylesheet.setAttribute('href','decode.css');
	//document.head.append(stylesheet);

	const MAXSIZE = Math.floor(1555/b45.CompressionRatio)-SplitHeader.SIZE;

	const codeReader = new ZXing.BrowserDatamatrixCodeReader();
	//const codeReader = new ZXing.BrowserQRCodeReader();
	let button = document.querySelector('button[name="decode"]');
	let progress = document.querySelector('progress[name="decode"]');

	button.disabled = true;

	let camera = await getMonitorSource();
	let indexcards = new Map();

	let debugvid = document.querySelector('video[name="debug"]');
	//debugvid.style.opacity = 0;
	debugvid.style.display = 'block';
	
	codeReader.decodeFromStream(camera,debugvid,(result,err)=>{
		if(err){
			console.debug(err);
		}
		if(!result) return;
		result = result.text;
		result = b45.decode(result);
		let header = new SplitHeader(result.buffer);

		let indexcard = indexcards.get(header.idString);
		if(!indexcard){
			let size = MAXSIZE * header.pages;
			progress.setAttribute('max',header.pages);
			indexcard = {
				id: header.idString,
				waiting: new Set([...Array(header.pages).keys()]),
				stm: new Uint8Array(size)
			};
			indexcards.set(indexcard.id, indexcard);
		}
		
		// if this item has already been processed, we can skip and wait for the next one
		let pct = Math.floor(indexcard.waiting.size / header.pages * 1000)/10;
		if(!indexcard.waiting.has(header.page)){
			console.debug(`skip: ${header.page} : ${indexcard.waiting.size} of ${header.pages} (${pct}%)`);
			return;
		}
		console.log(`${header.page} : ${indexcard.waiting.size} of ${header.pages} (${pct}%)`);

		// we have a unique buffer, decode it
		let buf = new Uint8Array(result.buffer, header.SIZE);
		let offset = MAXSIZE * header.page;
		// apply it to the larger stream
		indexcard.stm.set(buf,offset);
		indexcard.waiting.delete(header.page);
		progress.value = indexcard.waiting.size;

		if(indexcard.waiting.size === 0){
			codeReader.stopContinuousDecode();
			let stm = new Blob([indexcard.stm],{type:'application/epub+zip'});
			saveAs(stm,`${indexcard.id}.epub`);
			button.disabled = false;
			for(let stylesheet of document.querySelectorAll('link[href="decode.css"]')){
				document.head.remove(stylesheet);
			}
			for(let track of state.video.getTracks()){
				track.stop();
			}
			debugvid.style.display = 'none';
		}
	});
}
