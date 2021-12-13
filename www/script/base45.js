/**
 * https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
 */

export{
	encode,
	decode,
	CompressionRatio,
};

/**
 * Currently base64 which has a 4/3 (1.33) ratio
 */
const CompressionRatio = 4/3;

/**
 * Given a buffer, returns a string version
 *
 * @param {*} buffer
 * @returns
 */
function encode(buffer){
	if(buffer instanceof Blob) buffer = new Uint8Array(buffer);

	let str = String.fromCharCode(...buffer);
	str = window.btoa(str);
	str = str.replace(/\+/g,'-');
	str = str.replace(/\//g,'_');
	return str;
}

/**
 * Decodes the given string into a Buffer
 * @param {*} str
 * @returns {Uint8Array}
 */
function decode(str){
	str = str.replace(/-/g,'+');
	str = str.replace(/_/g,'/');
	let buffer = window.atob(str);
	buffer = buffer.split('').map(d=>{
		d = d.charCodeAt(0);
		return d;
	});
	buffer = new Uint8Array(buffer);
	return buffer;
}
