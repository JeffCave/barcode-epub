import Block from './Block.js';

export{
	ePub as default,
	ePub
};

/*
global
	Buffer
*/

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
class ePub{
	/**
	 * Current hash algorithm to be used ('SHA-512')
	 */
	static get HASH(){ return 'SHA-512'; }

	/**
	 * @param {Buffer} buffer representing the binary data of the ePub, or the db record to be formed
	 * @param {Object} opts collection of options
	 */
	constructor(buffer, opts = {}){
		this._ = Object.assign({
			hash: ePub.HASH
		},opts);
		if(buffer instanceof Blob){
			this.buffer = new Uint8Array(buffer.arrayBuffer());
		}
		// is this a DB record?
		if('_id' in buffer){
			this.rec = buffer;
		}
	}

	/**
	 * Calculates the unique id the ePub
	 *
	 * @returns {Uint8Array} 64-byte Array representing the file hash
	 */
	async calcFileHash(){
		let hash = ePub.calcFileHash(this.buffer);
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
	 * Calculates the unique id of a given buffer
	 *
	 * @param {Buffer} buffer
	 * @returns {Uint8Array} 64-byte Array representing the file hash
	 */
	static async calcFileHash(buffer){
		buffer = await buffer;
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

