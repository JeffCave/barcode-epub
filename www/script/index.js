/*
global
	saveAs
*/

import './widgets/~all.js';

import Barcoder from './bcode/Barcoder.js';
import Block from './bcode/Block.js';
import Camera from './bcode/Camera.js';
import ePub from './bcode/ePub.js';

const barcoder = new Barcoder();
const db = barcoder.db;
const state = {
	camera: null
};
let style = null;

window.addEventListener('load',()=>{

	db.changes({since:'now',live:true}).on('change', RenderIndex);
	RenderIndex();

	let buttons = {
		'button[name="fromVideo"]': ()=>{VideoDecode('monitor');},
		'button[name="fromCamera"]': ()=>{VideoDecode('camera');},
		'button[name="stop"]': ()=>{stopCamera();},
		'button[name="print"]': ()=>{window.print();},
		'button[name="fromEpub"]': ()=>{upload();},
		'header nav button[name="left"]' : ()=>{page(-1);},
		'header nav button[name="right"]': ()=>{page(+1);},
	};
	for(let b in buttons){
		document.querySelector(b).addEventListener('click',buttons[b]);
	}
	page(0);
	Animate(true,document.querySelector('div[name="codeset"]'));

	document
		.querySelector('#UploadEpub')
		.addEventListener('change', (e)=>{
			LoadFiles(e.target.files);
		});

	style = document.createElement('style');
	document.head.append(style);
	style  = style.sheet;

	style.insertRule('.preload{display:none}');
	Array.from(document.querySelectorAll('.waitload')).forEach(d=>{
		d.classList.remove('waitload');
	});
});


async function LoadFiles(files){
	if(files instanceof File){
		files = [files];
	}
	let updates = [];
	for(let file of files){
		let buff = await file.arrayBuffer();
		let blocks = Barcoder.ProcessBuffer(buff);
		for await (let block of blocks){
			let update = await barcoder.SaveBlock(block);
			updates.push(update);
		}
	}
	updates = Promise.all(updates);
	return updates;
}

let animator = {};
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


function upload(){
	let page = document.querySelector('ps-panel[name="library"]');
	let sections = Array.from(page.querySelectorAll('section'));
	for(let sect of sections){
		sect.classList.add('hide');
	}
	let sect = page.querySelector('section[name="file"]');
	sect.classList.remove('hide');
}


let VideoStatus_Clearer = null;
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
		VideoStatus(event.detail.status.level);
	});
	await state.camera.setMonitorSource(src);
	await barcoder.WatchVideo(state.camera);

	stopCamera();
}


function stopCamera(){
	state.camera.StopVideo();
	barcoder.StopVideo();
	let panel = document.querySelector('ps-panel[name="decoder"]');
	let buttons = Array.from(panel.querySelectorAll('button'));
	let stopButton = panel.querySelector('button[name="stop"]');
	buttons.forEach(b=>{b.classList.remove('hide');});
	stopButton.classList.add('hide');
}


async function encode(id = null){
	if (!id) return;

	let rec = await db.get(id,{
		attachments: true,
		binary: true
	});

	let imgcontainer = document.querySelector('div[name="codeset"]');
	imgcontainer.innerHTML = '';
	page(1);

	for (let block of Object.values(rec._attachments)){
		block = await block.data.arrayBuffer();
		block = new Uint8Array(block);
		block = new Block(block);
		let header = new block.header;
		let barcode = block.toImage();
		let img = document.createElement('img');
		img.setAttribute('alt', `${header.page} of ${header.pages} - ${header.idString}`);
		//img.transferFromImageBitmap(barcode);
		img.src = barcode;
		imgcontainer.append(img);
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
	let pages = document.querySelector('ps-tabpanel');
	pages.rotate(dir);
}


async function Download(id){
	let rec = await db.get(id,{include_docs:true,attachments:true,binary:true});
	let stm = ePub.toBuffer(rec);
	saveAs(stm,`${id}.epub`);
}


async function RenderIndex(){
	let page = document.querySelector('ps-panel[name="library"]');
	let htmlList = page.querySelector('ul');
	let template = page.querySelector('template');
	let recs = await db.allDocs({include_docs:true,attachments: false});

	htmlList.innerHTML = '';
	for(let rec of recs.rows){
		rec = rec.doc;
		let html = document.createElement('li');
		html.innerHTML = template.innerHTML;

		let id = rec._id;
		let rev = rec._rev;
		let curpages = Object.keys(rec._attachments||{}).length;
		let pct = Math.floor(curpages/rec.pages*100);

		html.querySelector('button[name="delete"]').addEventListener('click',()=>{db.remove(id,rev);});
		html.querySelector('button[name="send"]').addEventListener('click',()=>{encode(id);});
		html.querySelector('button[name="save"]').addEventListener('click',()=>{Download(id);});

		html.querySelector('output[name="id"]').title = id;
		html.querySelector('output[name="id"]').value = [id.slice(0,4),'…',id.slice(-4)].join('');
		html.querySelector('output[name="pages-current"]').value = curpages;
		html.querySelector('output[name="pages-total"]').value   = rec.pages;
		html.querySelector('output[name="pages-pct"]').value	 = pct;
		html.querySelector('output[name="title"]').value = rec.title;

		htmlList.append(html);
	}
}

