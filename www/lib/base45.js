/**
 * https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
 */

const CompressionRatio = 4/3;

function encode(buffer){
    let str = String.fromCharCode(...buffer);
    str = window.btoa(str);
    return str;
}

function decode(str){
    let buffer = window.atob(str);
    buffer = buffer.split('').map(d=>{
        d = d.charCodeAt(0);
        return d;
    });
    buffer = new Uint8Array(buffer);
    return buffer;
}

export{
    encode,
    decode,
    CompressionRatio,
};
