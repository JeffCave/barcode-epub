/**
 * https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
 */

const CompressionRatio = 4/3;

function encode(buffer){
    let str = String.fromCharCode(...buffer);
    str = window.btoa(str);
    str = str.replace(/\+/g,'-');
    str = str.replace(/\//g,'_');
    return str;
}

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

export{
    encode,
    decode,
    CompressionRatio,
};
