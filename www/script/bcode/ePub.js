import 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js';
/* global JSZip */

import * as b45 from '../base45.js';
import Block from './Block.js';
import BlockHeader from './BlockHeader.js';
import psThing from './psThing.js';

export{
	ePub as default,
	ePub
};

const domParser = new DOMParser();



/**
 * Interprets an EPub document
 *
 * The class EPub is used to help identify the components of an EPub.
 * Techincally, ePubs are zip files containing standard HTML, as well
 * as a couple of metadata files to assist readers.
 *
 * EPub is a W3C specification, https://www.w3.org/publishing/epub3/epub-overview.html
 *
 * We do treat EPubs a little specifically to our case. Specifically,
 * we need to make metadata highly accessible as well as identify if an
 * ePub is a unique file, as well as reconstitue the ePub from database
 * and serialize for database. We cannot do this by assuming the name
 * is unique, and therefore calculate a hash of the contents. This hash
 * is considered the ePub's unique identifier.
 */
class ePub extends psThing{
	/**
	 * Current hash algorithm to be used ('SHA-512')
	 */
	static get HASH(){ return 'SHA-512'; }

	/**
	 * @param {Buffer} buffer representing the binary data of the ePub, or the db record to be formed
	 * @param {Object} opts collection of options
	 */
	constructor(buffer, opts = {}){
		super(opts);
		this._.hashalgo = ePub.HASH;

		this.isLoaded = false;
		this.addEventListener('load',()=>{
			this.isLoaded = true;
		});

		this.rec = {};

		if(buffer instanceof Blob){
			this.parseBlob(buffer);
		}
		// is this a DB record?
		else if('_id' in buffer){
			this.rec = buffer;
			this.emit('load');
		}
	}

	/**
	 * waits for the ePub finishines loading
	 *
	 * @returns the ePub object
	 */
	async waitLoad(){
		if(this.isLoaded) return this;

		return new Promise((resolve)=>{
			this.addEventListener('load',()=>{
				resolve(this);
			});
		});
	}

	/**
	 * Clears the current ePub and replaces content with Blob
	 *
	 * @param {Blob} blob
	 */
	async parseBlob(blob){
		let prog = {
			lengthComputable: true,
			loaded: 0,
			total: 0
		};
		let header = null;
		this.isLoaded = false;
		let rec = {};
		rec._attachments = {};
		for await (let block of ePub.BlobToBlocks(blob)){
			header = block.header;
			if(prog.loaded === 0){
				rec._id = header.idString;
				rec.pages = header.pages;
				rec.meta = await ePub.getMeta(blob);
				prog.total = header.pages;
				this.emitChange('id');
				this.emitChange('pages');
				this.dispatchEvent(new ProgressEvent('blocks', prog));
			}
			rec._attachments[block.header.page.toString()] = {
				content_type: 'application/dpub-seg',
				data: new Blob([block.buffer])
			};
			this.emitChange('blocks');
			prog.loaded ++;
			this.dispatchEvent(new ProgressEvent('blocks', prog));
		}
		this.rec = rec;
		this.emit('load');
	}

	/**
	 * The ePub's signature
	 */
	get id(){
		return this.rec._id;
	}

	/**
	 * The total number of blocks in the ePub
	 */
	get pages(){
		return this.rec.pages;
	}

	/**
	 * Calculates the unique id the ePub
	 *
	 * @returns {Uint8Array} 64-byte Array representing the file hash
	 */
	async calcFileHash(){
		let hash = ePub.calcFileHash(this.toBlob().arrayBuffer());
		return hash;
	}

	/**
	 * The collection of blocks we currently have for the File
	 */
	async getBlocks(){
		if(this._.blocks) return this._.blocks;

		let rec = this.rec;
		let attachments = Object.values(rec._attachments);
		this._.blocks = new Map();
		for(let d of attachments){
			let buf = await d.data.arrayBuffer();
			let block = new Block(buf);
			let page = block.header.page;
			this._.blocks.set(page,block);
		}
		return this._.blocks;
	}

	/**
	 * Converts the underlying ePub to a blob format
	 *
	 * @returns {Blob} of the file
	 */
	async toBlob(){
		let rec = this.rec;
		let attachments = Object.values(rec._attachments);
		if(rec.pages !== attachments.length){
			return null;
		}
		let buff = [];
		for(let d of attachments){
			let buf = await d.data.arrayBuffer();
			let block = new Block(buf);
			block = block.body;
			buff.push(block);
		}
		let stm = new Blob(buff,{type:'application/epub+zip'});
		return stm;
	}

	/**
	 * Extracts the metadata from the ePub
	 *
	 * https://www.w3.org/publishing/epub32/epub-packages.html#conformance
	 *
	 * @returns JSON conformant Metadata
	 */
	async getMeta(){
		if (!this.rec) return null;
		if (this.rec.meta) return this.rec.meta;

		let meta = ePub.getMeta(this.toBlob());

		return meta;
	}


	/**
	 * Extracts the metadata from the ePub
	 *
	 * https://www.w3.org/publishing/epub32/epub-packages.html#conformance
	 *
	 * @returns JSON conformant Metadata
	 */
	static async getMeta(blob){
		let zip = blob;
		zip.relativePath = zip.relativePath || zip.webkitRelativePath || '.';

		let files = await JSZip.loadAsync(zip);
		files = files.files;
		let file = Object
			.keys(files)
			.filter(d=>{
				return /content.opf$/.test(d);
			})
			.sort((a,b)=>{
				return b.length - a.length;
			})
			.pop()
		;
		file = files[file];

		let bin = await file.async('blob');
		let txt = await bin.text();
		let xml = domParser.parseFromString(txt,'text/xml');
		let meta = {
			'@context': 'https://schema.org',
			'@type': 'Book',
			'bookFormat': 'EBook',
		};

		meta.identifier = this.idString;
		if(!meta.identifier){
			meta.identifier = await ePub.calcFileHash(blob);
			meta.identifier = b45.encode(meta.identifier);
			meta.identifier = meta.identifier.replace(/=/g,'');
		}
		meta.size = blob.size;

		let val = null;
		val = xml.querySelector('dateCopyrighted');
		if(val){
			meta.copyrightYear = val;
		}

		val = xml.querySelector('description');
		val = xml.querySelector('abstract');
		if(val){
			meta.abstract = val;
		}

		val = xml.querySelector('title');
		if(val){
			meta.name = val.textContent;
		}
		val = xml.querySelector('language');
		if(val){
			meta.inLanguage = val.textContent;
		}

		val = xml.querySelector('creator');
		if(val){
			meta.author = val.textContent;
		}

		val = xml.querySelectorAll('identifier');
		for(let v of val){
			if(v.attributes['opf:scheme'] === 'ISBN'){
				meta.isbn = v.textContent;
			}
		}

		val = xml.querySelector('publisher');
		if(val){
			meta.publisher = val.textContent;
		}

		val = xml.querySelectorAll('subject');
		meta.keywords = [];
		for(let v of val){
			meta.keywords.push(v.textContent);
		}
		return meta;
	}

	/**
	 * Converts a Blob into a series of parts as a generator
	 *
	 * Operates as an asynchronous generator which allows you to loop through the entire stream, but only performs calcuations on demand. The real trick is that it is `async`
	 *
	 * There is a special loop for these: `for await(let i of ProcessBuffer)`
	 *
	 * @param {Blob} stm
	 * @returns
	 */
	static async *BlobToBlocks(stm){
		stm = await stm.arrayBuffer();
		stm = new Uint8Array(stm);

		const header = new BlockHeader();
		//https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
		//const MAXSIZE = 1555-header.SIZE;
		const MAXSIZE = Block.MaxSize;

		header.pages = Math.ceil(stm.byteLength / MAXSIZE);
		header.id = await ePub.calcFileHash(stm);
		for(let offset = 0; offset < stm.byteLength; offset+=MAXSIZE){
			let len = stm.byteLength - offset;
			len = Math.min(len, MAXSIZE);

			let chunk = new Uint8Array(stm.buffer,offset,len);
			let block = new Block(len);
			block.header = header;
			block.body = chunk;

			yield block;

			header.page++;
		}
		return;
	}




	/**
	 * Calculates the unique id of a given buffer
	 *
	 * @param {Buffer} buffer
	 * @returns {Uint8Array} 64-byte Array representing the file hash
	 */
	static async calcFileHash(buffer){
		buffer = await buffer;
		// if its a file or blob, convert it to an buffer
		if(buffer instanceof Blob){
			buffer = await new Promise(function(resolve) {
				var reader = new FileReader();
				reader.onloadend = function() {
					resolve(reader.result);
				};
				reader.readAsArrayBuffer(buffer);
			});
		}
		// if its a buffer, convert it to a UInt8Array
		if(buffer instanceof ArrayBuffer){
			buffer = new Uint8Array(buffer);
		}
		let hash = await crypto.subtle.digest(ePub.HASH, buffer);
		return hash;
	}

	/**
	 * @deprecated: use instance method 'toBlob' instead
	 */
	static async toBuffer(rec){
		let epub = new ePub(rec);
		let stm = epub.toBlob();
		return stm;
	}

}

