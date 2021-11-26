import 'https://cdnjs.cloudflare.com/ajax/libs/pouchdb/7.0.0/pouchdb.min.js';

import '../lib/zxing.js';

/*
global
	PouchDB
*/

import Block from './Block.js';
import ePub from './ePub.js';
import BlockHeader from './BlockHeader.js';
import * as b45 from '../base45.js';

export{
	Barcoder as default,
	Barcoder
};

class Barcoder extends EventTarget{
	constructor(db,opts={}){
		super();
		if(!db){
			db = new PouchDB(this.constructor.name);
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


	async SaveBlock(block){
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
			return 'skip';
		}
		try{
			let result = await this.db.putAttachment(doc._id, page, doc._rev, new Blob([block]), 'application/dpub-seg');
			return result;
		}
		catch(e){
			console.error(e);
			return false;
		}
	}

	async WatchVideo(stream){
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
				this.SaveBlock(result,status).then(resolved);
			});
		});
		return state.watcher;
	}
}

