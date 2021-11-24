/**
 *
 */
const SplitHeader = require("./lib/barcodepub.js");

const fs = require('fs');
const sha = require('js-sha512');
const { debugPort, mainModule } = require('process');
const { glob } = require("glob");
const zxing = require('@zxing/library/umd');


Array.prototype.shuffle = function(){
	for(let i=this.length-1; i>=0; i--){
		j = Math.floor(Math.random()*i);
		let s = this[j];
		this[j] = this[i];
		this[i] = s;
	}
};


async function main(){
	let files = await new Promise(resolve=>{
		glob('./encoded/*.png',(err,files)=>{
			resolve(files);
		});
	});
	files.shuffle();
	const hints = new Map();
	const formats = [zxing.BarcodeFormat.QR_CODE, zxing.BarcodeFormat.DATA_MATRIX/*, ...*/];

	hints.set(zxing.DecodeHintType.POSSIBLE_FORMATS, formats);

	for(let file in files){
		const reader = new zxing.MultiFormatReader();

		reader.setHints(hints);
		let imgByteArray= fs.readFileSync(file);
		const luminanceSource = new zxing.RGBLuminanceSource(imgByteArray, imgWidth, imgHeight);
		const binaryBitmap = new zxing.BinaryBitmap(new zxing.HybridBinarizer(luminanceSource));

		reader.decode(binaryBitmap);

		console.log(`finished '${file}'`);
	}
	console.log(`done.`);
}


main();
