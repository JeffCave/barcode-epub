/*
global
	saveAs
*/

import './widgets/~all.js';

import Barcoder from './bcode/Barcoder.js';

const barcoder = new Barcoder();
/**
 * @deprecated
 */
const state = {
	/**
	 * @deprecated
	 */
	pages: null,
};
let style = null;


/**
 * Wait for the page to load before taking many of the actions.
 */
window.addEventListener('load',()=>{

	let pages = document.querySelector('ps-mobtabpanel');
	state.pages = pages;

	let list = document.querySelector('ps-epublist');
	list.addEventListener('send',send);
	list.addEventListener('save',Download);

	let scan = document.querySelector('ps-scanner');
	scan.addEventListener('start',()=>{
		pages.rotate('dload');
	});

	['ps-epublist','ps-scanner','ps-options'].forEach((d)=>{
		document.querySelector(d).barcoder = barcoder;
	});

	let buttons = {
		'button[name="print"]': ()=>{window.print();},
		'button[name="opts"]': ()=>{pages.rotate('options');},
	};
	for(let b in buttons){
		document.querySelector(b).addEventListener('click',buttons[b]);
	}
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


async function send(id = []){
	if (!id) return;

	id = Array.from(id.detail);
	let imgcontainer = document.querySelector('div[name="codeset"]');
	imgcontainer.innerHTML = '';
	state.pages.rotate('reader');

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

async function Download(id){
	id = Array.from(id.detail);
	let epubs = await barcoder.GetBooks(id);
	for(let epub of epubs){
		let stm = await epub.toBlob();
		saveAs(stm,`${id}.epub`);
	}
}


