import 'https://cdnjs.cloudflare.com/ajax/libs/pouchdb/7.0.0/pouchdb.min.js';

import '../lib/zxing.js';

/*
global
	PouchDB
	ZXing
*/

import * as b45 from '../base45.js';
import Block from './Block.js';
import Camera from './Camera.js';
import ePub from './ePub.js';
import psThing from './psThing.js';

export{
	Barcoder as default,
	Barcoder
};

const Readers = {
	'qrcode':()=>{return new ZXing.BrowserQRCodeReader();},
	'datamatrix':()=>{return new ZXing.BrowserDatamatrixCodeReader();},
};

/**
 * Stops the video monitoring and decoding.
 *
 * Implemented outside the class to make it a private instance. It is
 * tempting to call this instead of the Camera's stop which is more correct
 * (I think ... I actually have a doubt as I write this). Hiding this
 * function inside the module to prevent calls to it.
 *
 * @param {Barcoder} self
 * @param {Camera} camera
 * @returns
 */
function StopVideo(self, camera){
	if(!self.watcher) return;

	self.watcherresolver();
	self.watcher = null;
	if(camera && self.watcherStopper){
		camera.removeEventListener('pause',self.watcherStopper);
		self.watcherStopper = null;
	}
}

/**
 * The Barcode reader
 *
 * This is the primary library entry point. Most other classes are in support of this
 *
 * Acts as an underlying data point for encoding and maintaining the behaviour of a barcode library system.
 */
class Barcoder extends psThing{
	/**
	 *
	 * @param {*} db
	 * @param {*} opts
	 */
	constructor(db=null,opts={}){
		opts = Object.assign({
			//bcid: 'datamatrix',
			bcid: 'qrcode',
			padding: 1,
			scaleX: 2,
			scaleY: 2,
			hash:'SHA-512'
		},opts);
		super(opts);
		// create a database if one was not specified
		if(!db){
			db = new PouchDB(this.constructor.name);
			db.compact();
		}
		this.db = db;
		// emit an event everytime the database changes
		db.changes({since:'now',live:true}).on('change', (e)=>{
			this.emit('db',e);
			this.emitChange('db');
		});
	}


	/**
	 * @deprecated use class 'ePub' instead
	 */
	static ProcessBuffer(stm){
		return ePub.BlobToBlocks(stm);
	}


	/**
	 *
	 * @param {Uint8Array|string} id of the book to find
	 */
	async GetBook(id){
		let rec = await this.db.get(id,{
			attachments: true,
			binary: true
		});
		let epub = new ePub(rec);
		return epub;
	}

	/**
	 * Saves the item to disk
	 *
	 * @param {Block|ePub} item
	 */
	async Save(item){
		if(item instanceof Block){
			this.SaveBlock(item);
		}
		else if(item instanceof ePub){
			this.SaveEPub(item);
		}
		else{
			throw new TypeError('Unrecognized type');
		}
	}

	/**
	 * Saves and entire ePub to disk
	 *
	 * @param {ePub} epub
	 */
	async SaveEPub(epub){
		try{
			let doc = await this.db.get(epub.id);
			epub.rec._rev = doc._rev;
		}
		catch(e){
			if(![404].includes(e.status)) throw e;
		}
		this.db.put(epub.rec);
		this.emit('saveblock', {
			block: new Block(epub.rec._attachments.data),
			status: {level:'pass',code: 200, msg: 'Success'},
		});
	}

	/**
	 * Saves a partial block to disk
	 *
	 * @param {Block} block
	 * @param {int} ttl number of tries before fail
	 * @returns
	 */
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
			this.emit('saveblock', {
				block: header,
				status: {level:'skip',code: 208, msg: 'Already Recorded'},
			});
			return true;
		}
		try{
			let result = await this.db.putAttachment(doc._id, page, doc._rev, new Blob([block]), 'application/dpub-seg');
			this.emit('saveblock', {
				block: header,
				status: {level:'pass',code: 200, msg: 'Success'},
			});
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
		this.watcherStopper = ()=>{StopVideo(this,camera);};
		camera.addEventListener('pause',this.watcherStopper);
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

