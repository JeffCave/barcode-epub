import 'https://cdnjs.cloudflare.com/ajax/libs/pouchdb/7.0.0/pouchdb.min.js';

import '../lib/zxing.js';

/*
global
	PouchDB
	ZXing
*/

import * as b45 from '../base45.js';
import Block from './Block.js';
import BlockHeader from './BlockHeader.js';
import Camera from './Camera.js';
import ePub from './ePub.js';

export{
	Barcoder as default,
	Barcoder
};

const Readers = {
	'qrcode':()=>{return new ZXing.BrowserQRCodeReader();},
	'datamatrix':()=>{return new ZXing.BrowserDatamatrixCodeReader();},
};

class Barcoder extends EventTarget{
	constructor(db,opts={}){
		super();
		if(!db){
			db = new PouchDB(this.constructor.name);
			db.compact();
		}
		this._ = {
			//bcid: 'datamatrix',
			bcid: 'qrcode',
			padding: 1,
			scaleX: 2,
			scaleY: 2,
			hash:'SHA-512'
		};
		this._ = Object.assign(this._,opts);
		this.db = db;
	}


	static async *ProcessBuffer(stm){
		const header = new BlockHeader();

		//https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
		//const MAXSIZE = 1555-header.SIZE;
		const MAXSIZE = Math.floor(1555/b45.CompressionRatio)-header.SIZE;

		header.pages = Math.ceil(stm.byteLength / MAXSIZE);
		header.id = await ePub.calcFileHash(stm);
		for(let offset = 0; offset < stm.byteLength; offset+=MAXSIZE){
			let len = stm.byteLength - offset;
			len = Math.min(len, MAXSIZE);

			let chunk = new Uint8Array(stm,offset,len);
			let block = new Uint8Array(header.SIZE+len);
			block.set(header.bytes,0);
			block.set(chunk,header.SIZE);

			yield block;

			header.page++;
		}
		return;
	}


	async SaveBlock(block,ttl=10){
		if(!(block instanceof Block)){
			throw new TypeError('not an instance of type Block');
		}
		let header = block.header;
		header.validate();

		let doc = null;
		try{
			doc = await this.db.get(header.idString,{attachments:true});
		}
		catch(e){
			if(e.status === 404){
				doc = {
					_id: header.idString,
					pages: header.pages,
					_attachments:{}
				};
				await this.db.put(doc);
			}
			else{
				throw e;
			}
		}

		let page = header.page.toFixed(0);
		if(page in doc._attachments){
			let event = new CustomEvent('saveblock', {
				detail: {
					block: header,
					status: {level:'skip',code: 208, msg: 'Already Recorded'},
				}
			});
			this.dispatchEvent(event);
			return true;
		}
		try{
			let result = await this.db.putAttachment(doc._id, page, doc._rev, new Blob([block]), 'application/dpub-seg');
			let event = new CustomEvent('saveblock', {
				detail: {
					block: header,
					status: {level:'pass',code: 200, msg: 'Success'},
				}
			});
			this.dispatchEvent(event);
			return result;
		}
		catch(e){
			if(e.status === 409 && ttl > 0) {
				setTimeout(()=>{
					this.SaveBlock(block,ttl--);
				});
				return true;
			}

			console.error(e);
			let event = new CustomEvent('saveblock', {
				detail: {
					block: header,
					status: {level:'fail',code: e.status, msg: e.message},
				}
			});
			this.dispatchEvent(event);
			this.lastpage = null;
			return false;
		}
	}

	async WatchVideo(camera){
		if(!(camera instanceof Camera)) throw new TypeError('stream must be an instance of `Camera`');
		if (this.watcher) return this.watcher;

		if(!this.codeReader){
			let reader = this._.bcid;
			reader = Readers[reader]();
			this.codeReader = reader;
		}

		let video = document.querySelector('video');

		this.watcher = new Promise((resolved,reject)=>{
			this.watcherresolver = resolved;
			this.codeReader.decodeFromStream(camera.stream,video,(result,err)=>{
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
				if(result === this.lastpage){
					let event = new CustomEvent('saveblock', {
						detail: {
							block: null,
							status: {level:'skip',code: 204, msg: 'Just processed'},
						}
					});
					this.dispatchEvent(event);
					return false;
				}
				this.lastpage = result;

				result = b45.decode(result);
				let block = new Block(result);
				this.SaveBlock(block).then(resolved);
			});
		});
		return this.watcher;
	}
}

