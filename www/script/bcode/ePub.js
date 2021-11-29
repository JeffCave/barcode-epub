import Block from './Block.js';

export{
	ePub as default,
	ePub
};


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
		this.parts = new Map();
		this._ = Object.assign({
			hash: ePub.HASH
		},opts);

	}

	/**
	 * Calcualtes the unique id the ePub
	 *
	 * @returns {Uint8Array} 64-byte Array representing the file hash
	 */
	async calcFileHash(){
		let hash = ePub.calcFileHash(this.buffer);
		return hash;
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

	static async toBuffer(rec){
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

}

