/*
https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
*/
export {
	Decode as default
};

import SplitHeader from "./lib/bcode/splitheader.js";
import * as b45 from './lib/base45.js';

const state = {
	video: null
};

async function getMonitorSource(src='monitor',light=false){
	if(state.video) return state.video;

	if(src === 'monitor'){
		state.video = await navigator.mediaDevices.getDisplayMedia();
	}
	else{
		state.video = await navigator.mediaDevices.getUserMedia({ 
			audio:false,
			video: {
				facingMode: 'environment'
		  	}
		});
		if(light){
			state.video.getVideoTracks()[0].applyConstraints({advanced:[{torch:true}]});
		}
	}
	return state.video;
}

async function Decode(imgsource='monitor',status){

	const MAXSIZE = Math.floor(1555/b45.CompressionRatio)-SplitHeader.SIZE;

	//const codeReader = new ZXing.BrowserDatamatrixCodeReader();
	const codeReader = new ZXing.BrowserQRCodeReader();
	let camera = await getMonitorSource(imgsource);
	let indexcards = new Map();

	let debugvid = document.querySelector('video');
	//debugvid.style.opacity = 0;
	debugvid.style.display = 'block';
	
	codeReader.decodeFromStream(camera,debugvid,(result,err)=>{
		if(err){
			switch(err.name){
				case 'FormatException':
				case 'NotFoundException':
					console.debug(err);
					break;
				default:
					console.error(err);
					break;
			}
		}
		if(!result) return false;


		status.status.classList.add('pass');
		result = result.text;
		result = b45.decode(result);
		let header = new SplitHeader(result.buffer);

		let indexcard = indexcards.get(header.idString);
		if(!indexcard){
			let size = MAXSIZE * header.pages;
			status.progress.setAttribute('max',header.pages);
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
		status.progress.value = indexcard.waiting.size;

		if(indexcard.waiting.size === 0){
			codeReader.stopContinuousDecode();
			let stm = new Blob([indexcard.stm],{type:'application/epub+zip'});
			saveAs(stm,`${indexcard.id}.epub`);
			for(let track of state.video.getTracks()){
				track.stop();
			}
			debugvid.style.display = 'none';
		}
	});
}
