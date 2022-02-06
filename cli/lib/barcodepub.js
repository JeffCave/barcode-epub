class SplitHeader {
	constructor(buffer=null){
		let p = {};
		if(!buffer){
			buffer = Buffer.alloc(SplitHeader.SIZE);
			// First two bytes are going to spell "dp" for "dpub"
			let bytes = new Uint8Array(buffer.buffer,0);
			'dp'.split('')
				.forEach((d,i)=>{
					bytes[i] = d.charCodeAt(0);
				});
		}
		p.buffer = buffer;
		p.bytes = new Uint8Array(buffer.buffer,0);
		p.id = new Uint8Array(buffer.buffer,4,64);
		p.page = new Uint16Array(buffer.buffer,68,2);
		this.p = p;
	}

	calcChecksum(){
		let sum = 'U'.charCodeAt(0);
		for(let i=4; i<this.p.bytes.length; i++){
			sum += this.p.bytes[i];
			sum += Math.floor(sum / 256);
			sum %= 256;
		}
		return sum;
	}

	setCheck(){
		this.p.bytes[3] = this.calcChecksum();
		return this.p.bytes[3];
	}

	get header(){
		return bytes;
	}

	get version(){
		return this.p.bytes[2];
	}
	set version(value){
		value = value || 0;
		value = ~~value; // abs-numeric
		this.p.bytes[2] = value;
	}

	get checksum(){
		return this.p.bytes[3];
	}

	get id(){
		let id = this.p.id;
		return id;
	}
	set id(value){
		for(let i=Math.min(value.length,this.p.id.length)-1; i>=0; i--){
			this.p.id[i] = value[i];
		}
		this.setCheck();
	}
	get page(){
		return this.p.page[0];
	}
	set page(value){
		value = value || 0;
		value = ~~value; // abs-numeric
		this.p.page[0] = value;
		this.setCheck();
	}
	get pages(){
		return this.p.page[1];
	}
	set pages(value){
		value = value || 0;
		value = ~~value; // abs-numeric
		this.p.page[1] = value;
		this.setCheck();
	}
	get buffer(){
		return this.p.buffer;
	}

	get SIZE(){
		return 72;
	}
}
SplitHeader.SIZE = 72;

exports.SplitHeader = SplitHeader;
