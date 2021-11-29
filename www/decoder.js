import Barcoder from './script/bcode/Barcoder.js';
import Block from './script/bcode/Block.js';
import Camera from './script/bcode/Camera.js';

export {
	WatchVideo,
	StopVideo,
	SaveBlock
};

const state = {
	video: null,
	codeReader: null
};
const barcoder = new Barcoder();

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
	if(!state.camera){
		state.camera = new Camera();
	}
	barcoder.addEventListener('saveblock',(event)=>{
		status(event.detail.status.level);
	});
	await state.camera.setMonitorSource(imgsource);
	return barcoder.WatchVideo(state.camera);
}

/**
 * @deprecated use 'Camera.StopVideo' instead
 */
function StopVideo(){
	state.camera.StopVideo();
}

/**
 * @deprecated use 'Barcoder.SaveBlock' instead
 */
async function SaveBlock(block,status=()=>{}){
	block = new Block(block);
	let result = barcoder.SaveBlock(block);
	status(result);
}
