/*
global
	saveAs
*/

import './widgets/~all.js';

import Barcoder from './bcode/Barcoder.js';
import Camera from './bcode/Camera.js';

const barcoder = new Barcoder();
const state = {
	camera: null
};
let style = null;


/**
 * Wait for the page to load before taking many of the actions.
 */
window.addEventListener('load',()=>{

	let list = document.querySelector('ps-epublist');
	list.barcoder = barcoder;
	list.addEventListener('send',send);
	list.addEventListener('save',Download);

	let buttons = {
		'button[name="fromVideo"]': ()=>{VideoDecode('monitor');},
		'button[name="fromCamera"]': ()=>{VideoDecode('camera');},
		'button[name="stop"]': ()=>{stopCamera();},
		'button[name="print"]': ()=>{window.print();},
		'header nav button[name="left"]' : ()=>{page(-1);},
		'header nav button[name="right"]': ()=>{page(+1);},
	};
	for(let b in buttons){
		document.querySelector(b).addEventListener('click',buttons[b]);
	}
	page(0);
	Animate(true,document.querySelector('div[name="codeset"]'));

	style = document.createElement('style');
	document.head.append(style);
	style  = style.sheet;

	style.insertRule('.preload{display:none}');
	Array.from(document.querySelectorAll('.waitload')).forEach(d=>{
		d.classList.remove('waitload');
	});
},{once:true});




/*********************************************************************
* The rest of the page is primarily made up of the handling of visual
* elements. These should be moved into Custom Elements their own.
*********************************************************************/


let animator = {};
/**
 * Animates the slideshow of images shown during transmission
 */
function Animate(start=null,container=animator.container){
	const ANIM_SPEED = 2000;
	//const ANIM_SPEED = 750;
	if(typeof start !== 'boolean'){
		start = null;
	}
	if(start === null){
		Animate(!animator.animation);
	}
	else if (start === false && animator.animation){
		clearInterval(animator.animation);
		animator.animation = null;
	}
	else if(start == true && !animator.animation){
		animator.lastshow = 0;
		animator.container = container;

		let changeslide = ()=>{
			let imgs = Array.from(animator.container.querySelectorAll('img'));
			if(imgs.length == 0) return;

			imgs[animator.lastshow].classList.remove('show');

			let i = (Date.now()/ANIM_SPEED) % imgs.length;
			i = Math.floor(i);
			imgs[i].classList.add('show');
			animator.lastshow = i;
		};

		animator.animation = setInterval(changeslide,ANIM_SPEED);
		changeslide();
	}
}




let VideoStatus_Clearer = null;
/**
 * Handles the animation of the status button
 *
 * @param {string} status
 * @returns
 */
function VideoStatus(status){
	const allowed = ['pass','fail','warn','skip'];
	if(!allowed.includes(status)) return;

	let led = document.querySelector('.status');

	clearTimeout(VideoStatus_Clearer);
	// set the status
	window.navigator.vibrate(200);
	led.classList.add(status);
	// let it take effect
	VideoStatus_Clearer = setTimeout(() => {
		VideoStatus_Clearer = null;
		// then remove it, so that it fades away
		led.classList.remove(... allowed);
	});
}


/**
 * Hides the video seelction buttons and attaches the camera to barcoder.
 *
 * @param {*} src
 */
async function VideoDecode(src='monitor'){
	let panel = document.querySelector('ps-panel[name="decoder"]');
	let buttons = Array.from(panel.querySelectorAll('button'));
	let stopButton = panel.querySelector('button[name="stop"]');

	buttons.forEach(b=>{b.classList.add('hide');});
	stopButton.classList.remove('hide');
	page('decoder');

	if(!state.camera){
		state.camera = new Camera();
	}
	barcoder.addEventListener('saveblock',(event)=>{
		if(event.detail.status.code === 204) return;
		VideoStatus(event.detail.status.level);
	});
	await state.camera.setMonitorSource(src);
	await barcoder.WatchVideo(state.camera);

	stopCamera();
}


/**
 * Handles a "stop" button click
 */
function stopCamera(){
	state.camera.StopVideo();
	let panel = document.querySelector('ps-panel[name="decoder"]');
	let buttons = Array.from(panel.querySelectorAll('button'));
	let stopButton = panel.querySelector('button[name="stop"]');
	buttons.forEach(b=>{b.classList.remove('hide');});
	stopButton.classList.add('hide');
}


async function send(id = []){
	if (!id) return;

	id = Array.from(id.detail);
	let imgcontainer = document.querySelector('div[name="codeset"]');
	imgcontainer.innerHTML = '';
	page(1);

	let epubs = await barcoder.GetBooks(id);
	for(let epub of epubs){
		let blocks = await epub.getBlocks();
		for (let block of blocks.values()){
			let header = block.header;
			let barcode = await block.toImage();
			let img = document.createElement('img');
			img.setAttribute('alt', `${header.page} of ${header.pages} - ${header.idString}`);
			//img.transferFromImageBitmap(barcode);
			img.src = barcode;
			imgcontainer.append(img);
		}
	}
}


/**
 * Changes the visible page to the specified page.
 *
 * Page can be specified as a string or an integer. A string specifies
 * the absolute page name to be changed to, integers represent the number
 * of page to move by from current position.
 *
 * The pages are conceptually in a carosel, so negative numbers move left,
 * postive numbers move right.
 *
 * Nonsensical values result in a page move of 0 (stay where you are)
 *
 * @param {int|string} dir
 */
function page(dir=1){
	let pages = document.querySelector('ps-mobtabpanel');
	pages.rotate(dir);
}


async function Download(id){
	id = Array.from(id.detail);
	let epubs = await barcoder.GetBooks(id);
	for(let epub of epubs){
		let stm = await epub.toBlob();
		saveAs(stm,`${id}.epub`);
	}
}


