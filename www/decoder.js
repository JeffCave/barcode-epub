/*
https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
*/
export {
    Decode as default
};

import SplitHeader from "./lib/splitheader.js";
import * as b45 from './lib/base45.js';

async function Decode(){
    const MAXSIZE = Math.floor(1555/b45.CompressionRatio)-SplitHeader.SIZE;

    const codeReader = new ZXing.BrowserDatamatrixCodeReader();
    let stm = null;
    let progress = document.querySelector('progress[name="decode"]');

    let imgs = Array.from(document.querySelectorAll('main > img'));
    for (let img of imgs){
        let result = await codeReader.decodeFromImage(undefined,img.src);
        result = result.text;
        result = b45.decode(result);
        let header = new SplitHeader(result.buffer);
        console.log(`${header.page} of ${header.pages}`);
        let buf = new Uint8Array(result.buffer, header.SIZE);

        if(!stm){
            let size = MAXSIZE * header.pages;
            stm = new Uint8Array(size);
            progress.setAttribute('max',header.pages);
        }
        let offset = MAXSIZE * header.page;
        stm.set(buf,offset);
        progress.value += 1;
    }
    return stm;

}
