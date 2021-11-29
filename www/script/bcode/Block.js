//import "../lib/bwip-js/bwipp.js";
//import "../lib/bwip-js/bwipjs.js";
//import "../lib/bwip-js/lib/xhr-fonts.js";
//import "../lib/bwip-js/lib/bitmap.js";

/*
global
	BWIPP
	BWIPJS
	Bitmap
	bwipjs_fonts
*/

import BlockHeader from './BlockHeader.js';
import * as b45 from '../base45.js';

export{
	Block as default,
	Block
};

const monochrome = true;
const bwipp = BWIPP();
const state = {
	canvas: null,
	context: null,
};

/**
 * A reconstructable component of a data file
 *
 * EPubs are split into Blocks for transmission. The file is split into
 * parts the size that a block can hold, a bit of metadata is added to
 * the file (like it position in the larger set).
 *
 * The block can then be presented as a binary array, or converted to
 * a Barcode for distribution
 */
class Block extends Uint8Array{
	constructor(buffer,offset=0){
		if(!buffer){
			buffer = Block.MaxSize;
		}
		if(Number.isInteger(buffer)){
			buffer += BlockHeader.SIZE;
			super(buffer);
		}
		else{
			super(buffer,offset,Block.MaxSize+BlockHeader.SIZE);
		}
		this.p = {};
	}

	/**
	 * {BlockHeader} The current header of the block
	 */
	get header(){
		if(!this.p.header){
			this.p.header = new BlockHeader(this);
		}
		return this.p.header;
	}

	set header(head){
		if(!(head instanceof BlockHeader)) throw TypeError('Not an instance of a SplitHeader');
		this.set(head.bytes,0);
	}

	/**
	 * The binary payload content of the block
	 */
	get body(){
		if(this.p.body) return this.p.body;
		let body = new Uint8Array(this,this.header.SIZE+1);
		body = String.fromCharCode(... body);
		this.p.body = body;
		return this.p.body;
	}
	set body(bytes){
		this.set(bytes,this.header.SIZE);
	}

	/**
	 * Generates the image that represents the block
	 *
	 * @returns {Bitmap} a bitmap image of teh Barcode
	 */
	toImage(){
		let data = this;
		if(!state.context){
			// this should be an offscreen canvas
			//state.canvas = document.querySelector('canvas').getContext('2d');
			if(window.OffscreenCanvas){
				state.canvas = new OffscreenCanvas(146, 146);
			}
			else{
				state.canvas = document.createElement('canvas');
				state.canvas.height = 146;
				state.canvas.width = state.canvas.height;
				state.canvas.style.opacity = 0;
				document.body.append(state.canvas);
			}
			state.context = state.canvas.getContext('2d');
		}

		let cfg = {
			//bcid: 'datamatrix',
			bcid: 'qrcode',
			padding: 1,
			scaleX: 2,
			scaleY: 2
		};
		return new Promise((success,fail)=>{
			setTimeout(()=>{
				const bw = new BWIPJS(bwipjs_fonts, monochrome);
				bw.bitmap(new Bitmap(state.context.canvas));
				let scale = 2;
				let pad = 10;
				bw.scale(scale,scale);
				pad *= scale;
				bw.bitmap().pad(pad,pad);
				data = b45.encode(data);
				bwipp(bw, cfg.bcid, data, cfg);
				bwipjs_fonts.loadfonts(async function(e) {
					if (e) {
						fail(e);
						return;
					}
					bw.render();

					//Apparently the parser wants a "white" border around the image. I'm annoyed by this, but ...
					let img = state.context.canvas;
					if('toDataURL' in img){
						img = img.toDataURL();
						success(img);
					}
					else{

						const reader = new FileReader();
						reader.addEventListener('load', function () {
							success(reader.result);
						}, false);
						img = await img.convertToBlob();
						reader.readAsDataURL(img);
					}
				});
			},1);
		});
	}


}

Block.MaxSize = Math.floor(1555/b45.CompressionRatio)-BlockHeader.SIZE;
