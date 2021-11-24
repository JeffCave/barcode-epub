/**
 * Given A4 paper is 21 x 29.7cm and it is important to leave enough
 * margin for binding (and hole punching), an optimal size appears to
 * be 5 across (@3.4x3.4 cm each)
 *
 * Splitting: 4 bytes for a protocol identifier + 64bytes for a UID (sha512) + 2 bytes for sequence ID + 2 bytes for total packages
 * 72 bytes total
 */
const {SplitHeader} = require("./lib/barcodepub.js");

const bwipjs = require('bwip-js');
const fs = require('fs');
const sha = require('js-sha512');
const { debugPort, mainModule } = require('process');


async function ProcessChunk(chunk,i){
	let arr = new Uint8Array(chunk);
	arr = String.fromCharCode(...arr);
	try{
		let png = await bwipjs.toBuffer({
			bcid: 'datamatrix',
			text: arr,
			//scale: 3,
			//height: 10, width: 10, // in millimeters
			includetext: false,
			textxalign:  'center',
		});
		fs.writeFileSync(`./encoded/s${i}.png`, png,  "binary");
	}
	catch(e){
		console.error(`BWIPP failed on ${i}`);
	}
}

async function calcFileHash(file){
	let promise = new Promise(resolve=>{
		let stmIn = fs.createReadStream(file);
		let hash = sha.sha512.create();
		stmIn.on( 'data' , (chunk)=>{
			let arr = new Uint8Array(chunk);
			arr = String.fromCharCode(...arr);
			hash.update(arr);
		} );
		stmIn.on( 'end' , ()=>{
			hash = hash.arrayBuffer();
			hash = new Uint8Array(hash);
			resolve(hash);
		});
	});
	promise = await promise;
	return promise;
}

async function main(){

	const header = new SplitHeader();
	//https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
	let MAXSIZE = 1556-header.SIZE;
	let testfile = './www/book/thoreau.LifeWoods.epub';
	let fsize = fs.statSync(testfile);
	header.pages = Math.ceil(fsize.size / MAXSIZE);
	header.id = await calcFileHash(testfile);
	const stmIn = fs.createReadStream(testfile, {highWaterMark: MAXSIZE});
	stmIn.on( 'data' , (chunk)=>{
		chunk = Buffer.concat([header.buffer,chunk]);
		ProcessChunk(chunk,header.page);
		header.page++;
	} );
}

main();
