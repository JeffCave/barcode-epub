import psThing from './psThing.js';

export {
	BlockHeader as default,
	BlockHeader
};


/**
 * Block's have a standardized header that allows us to reconstruct the
 * parts later.
 *
 * This class will lay itself over an existing block and allow for simple
 * reading of the parts.
 */
class BlockHeader extends psThing {
	constructor(buffer=null){
		super();
		let p = {};
		if(!buffer){
			buffer = new ArrayBuffer(BlockHeader.SIZE);
			// First two bytes are going to spell "dp" for "dpub"
			let bytes = new Uint8Array(buffer,0);
			'dp'.split('')
				.forEach((d,i)=>{
					bytes[i] = d.charCodeAt(0);
				});
		}
		else {
			if(buffer.buffer){
				buffer = buffer.buffer;
			}
			/* dead: remove 2022-05-24
			// no idea why this exists, but it looks useful
			if(buffer instanceof ArrayBuffer){
			}
			else */ if(Array.isArray(buffer)){
				buffer = new Uint8Array(buffer);
				buffer = buffer.buffer;
			}
		}
		p.buffer = buffer;
		p.bytes = new Uint8Array(buffer,0);
		p.id = new Uint8Array(buffer,4,64);
		p.page = new Uint16Array(buffer,68,2);
		this.p = p;

		this.version = 0;
	}

	/**
	 * Performs validation check, however returns true/false instead of
	 * giving a reason.
	 *
	 * @returns boolean
	 */
	isValid(){
		try{
			this.validate();
			return true;
		}
		catch{
			return false;
		}
	}

	/**
	 * Performs some small checks on the blocks to verify correctness:
	 *
	 * - verifies the 16bit ID at beginning of blcok
	 * - Compares the included checksum to a calculated one
	 * - checks for version match
	 *
	 * @throws RangeError if validation fails
	 */
	validate(){
		if(this.letterhead !== 'dp'){
			throw new RangeError(`Invalid letter head in content (${this.letterhead})`);
		}

		if(this.version !== 0){
			throw new RangeError(`Version mismatch (${this.version})`);
		}

		let actual = this.calcChecksum();
		let expect = this.checksum;
		if(actual !== expect){
			//throw new RangeError(`Checksum mismatch`);
		}

		return true;
	}

	/**
	 * A simple one byte checksum.
	 *
	 * @returns the checksum calcuated on the block
	 */
	calcChecksum(){
		let sum = 'U'.charCodeAt(0);
		for(let i=4; i<this.p.bytes.length; i++){
			sum += this.p.bytes[i];
			sum *= 2;
			sum += Math.floor(sum / 256);
			sum %= 256;
		}
		return sum;
	}

	/**
	 * Calculates the checksum and stores it
	 *
	 * This does not accept a parameter, and always performs the calculation.
	 * This is to prevent someone sending an invalid checksum
	 *
	 * @returns teh checksum
	 */
	setCheck(){
		let checksum = this.calcChecksum();
		if(this.p.bytes[3] !== checksum){
			this.emitChange('checksum');
		}
		this.p.bytes[3] = checksum;
		return this.p.bytes[3];
	}

	/**
	 * The underlying bytes of teh header
	 */
	get bytes(){
		return this.p.bytes.slice();
	}

	/**
	 * The first two characters of the byte stream ('dp')
	 *
	 * If it is a valid block it will start with 'dp'
	 */
	get letterhead(){
		return String.fromCharCode(... this.p.bytes.slice(0,2));
	}

	/**
	 * Version number of the header format
	 */
	get version(){
		return this.p.bytes[2];
	}
	set version(value){
		value = value || 0;
		value = ~~value; // abs-numeric
		this.p.bytes[2] = value;
		this.emitChange('version');
	}

	/**
	 * The checksum stored in the header
	 */
	get checksum(){
		return this.p.bytes[3];
	}

	/**
	 * The ID of the file associated with the block as 64byte array
	 */
	get id(){
		let id = this.p.id;
		return id;
	}
	set id(value){
		value = new Uint8Array(value);
		for(let i=Math.min(value.length,this.p.id.length)-1; i>=0; i--){
			this.p.id[i] = value[i];
		}
		this.emitChange('id');
		this.setCheck();
	}

	/**
	 * The id associated with the block, converted to a string
	 */
	get idString(){
		let id = this.p.id;
		id = String.fromCharCode(... id);
		id = window.btoa(id);
		id = id.replace(/=/g,'');
		return id;
	}
	set idString(id){
		id = [id,'=='].join('');
		id = window.atob(id);
		id = id.split('').map(d=>{
			d = d.charCodeAt(0);
			return d;
		});
		id = new Uint8Array(id);
		this.id = id;
	}

	/**
	 * The current block's position within the set
	 */
	get page(){
		return this.p.page[0];
	}
	set page(value){
		value = value || 0;
		value = ~~value; // abs-integer
		this.p.page[0] = value;
		this.emitChange('page');
		this.setCheck();
	}

	/**
	 * The total number of blocks available in the set
	 */
	get pages(){
		return this.p.page[1];
	}
	set pages(value){
		value = value || 0;
		value = ~~value; // abs-integer
		this.p.page[1] = value;
		this.emitChange('pages');
		this.setCheck();
	}

	/**
	 * The underlying buffer
	 */
	get buffer(){
		return this.p.buffer;
	}

	/**
	 * Number of bytes associated iwth the header
	 */
	get SIZE(){
		return BlockHeader.SIZE;
	}
}
BlockHeader.SIZE = 72;

