import * as b45 from './script/base45.js';
import Block from './script/bcode/Block.js';
import Barcoder from './script/bcode/Barcoder.js';

export {
	WatchVideo,
	StopVideo,
	SaveBlock
};

const state = {
	video: null,
	codeReader: null
};

/**
 * @deprecated use 'Camera.getMonitorSource' instead
 */
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

/**
 * @deprecated: use 'Barcoder.WatchVideo' instead
 */
async function WatchVideo(imgsource='monitor',status=()=>{}){
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
					case 'ChecksumException':
					//case 'NullPointerException':
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
			// we have simply discovered the last one we processed
			if(result === state.lastpage){
				return false;
			}
			state.lastpage = result;

			result = b45.decode(result);
			SaveBlock(result,status);
		});
	});
	return state.watcher;
}

/**
 * @deprecated use 'Camera.StopVideo' instead
 */
function StopVideo(){
	state.codeReader.stopContinuousDecode();
	for(let track of state.video.getTracks()){
		track.stop();
	}
	state.watcherresolver(true);
	state.watcher = null;
}

/**
 * @deprecated use 'Barcoder.SaveBlock' instead
 */
async function SaveBlock(block,status=()=>{}){
	block = new Block(block);
	let result = Barcoder.SaveBlock(block);
	status(result);
}
