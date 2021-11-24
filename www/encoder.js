
export {
	calcFileHash,
	Process,
	Barcode,
};

import Barcoder from "./script/bcode/Barcoder.js";
import ePub from "./script/bcode/ePub.js";
import Block from './script/bcode/Block.js';

/**
 * @deprecated use 'epub.calcFileHash' instead
 */
function calcFileHash(buffer){
	console.warn('Deprecated: `calcFileHash` is deprecated use `ePub.calcFileHash`');
	return ePub.calcFileHash(buffer);
}

/**
 * @deprecated use 'Block.toImage' instead
 */
function Barcode(data){
	console.warn('Deprecated: `Barcode` is deprecated use `Block.toImage`');
	let block = new Block(data);
	let img = block.toImage();
	return img;
}

/**
 * @deprecated use 'Barcode.ProcessBuffer' instead
 */
function Process(stm){
	console.warn('Deprecated: `Process` is deprecated use `Barcode.ProcessBuffer`');
	let generator = Barcoder.ProcessBuffer(stm);
	return generator;
}
