import "https://cdnjs.cloudflare.com/ajax/libs/pouchdb/7.0.0/pouchdb.min.js";

import SplitHeader from "./lib/bcode/splitheader.js";
import * as b45 from './lib/base45.js';

export {
	WatchVideo,
	StopVideo,
	SaveBlock
};

const db = new PouchDB('barcodelib');

const state = {
	video: null,
	codeReader: null
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

async function WatchVideo(imgsource='monitor'){
	if (state.watcher) return state.watcher;

	if(!state.codeReader){
		//state.codeReader = new ZXing.BrowserDatamatrixCodeReader();
		state.codeReader = new ZXing.BrowserQRCodeReader();
	}
	let camera = await getMonitorSource(imgsource);

	let video = document.querySelector('video');
	
	state.watcher = new Promise((resolved,reject)=>{
		state.watcherresolver = resolved;
		state.codeReader.decodeFromStream(camera,video,(result,err)=>{
			if(err){
				switch(err.name){
					case 'FormatException':
					case 'NotFoundException':
						console.debug(err);
						break;
					default:
						console.error(err);
						reject(err);
						break;
				}
			}
			if(!result) return false;

			result = result.text;
			result = b45.decode(result);
			SaveBlock(result);
		});
	});
	return state.watcher;
}


function StopVideo(){
	state.codeReader.stopContinuousDecode();
	for(let track of state.video.getTracks()){
		track.stop();
	}
	state.watcherresolver(true);
	state.watcher = null;
}


async function SaveBlock(block){
	let header = new SplitHeader(block);
	if(!header.isValid()){
		return null;
	}
	
	let doc = null;
	try{
		doc = await db.get(header.idString,{attachments:true});
	}
	catch(e){
		if(e.status === 404){
			doc = {
				_id: header.idString,
				pages: header.pages,
				_attachments:{}
			};
			await db.put(doc);
		}
		else{
			throw e;
		}
	}
	
	let page = header.page.toFixed(0);
	if(page in doc._attachments){
		return true;
	}
	try{
		let result = await db.putAttachment(doc._id, page, doc._rev, new Blob([block]), 'application/dpub-seg');
		return result;
	}
	catch(e){
		console.error(e);
		return false;
	}
}
