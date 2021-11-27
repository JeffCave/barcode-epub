
export{
	ePub as default,
	ePub
};

class ePub{
	static get HASH(){ return 'SHA-512'; }

	constructor(opts = {}){
		this.parts = new Map();
		this._ = Object.assign({
			hash: ePub.HASH
		},opts);

	}

	static async calcFileHash(buffer){
		buffer = await buffer;
		if(buffer instanceof ArrayBuffer){
			buffer = new Uint8Array(buffer);
		}
		let hash = await crypto.subtle.digest(ePub.HASH, buffer);
		return hash;
	}

	async calcFileHash(){
		let hash = ePub.calcFileHash(this.buffer);
		return hash;
	}


}

