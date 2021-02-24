/*
https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
*/
export {
    Decode as default
};

import SplitHeader from "./lib/splitheader.js";
import * as b45 from './lib/base45.js';

const state = {
    video: null
};

async function getMonitorSource(){
    if(state.video) return state.video;
    state.video = await navigator.mediaDevices.getDisplayMedia();
    return state.video;
}

async function Decode(){
    let stylesheet = document.createElement('link');
    stylesheet.setAttribute('rel','stylesheet');
    stylesheet.setAttribute('type','text/css');
    stylesheet.setAttribute('href','decode.css');
    document.head.append(stylesheet);

    const MAXSIZE = Math.floor(1555/b45.CompressionRatio)-SplitHeader.SIZE;

    const codeReader = new ZXing.BrowserDatamatrixCodeReader();
    let stm = null;
    let button = document.querySelector('button[name="decode"]');
    let progress = document.querySelector('progress[name="decode"]');

    button.disabled = true;

    let imgs = await getMonitorSource();
    let indexcard = null;

    let debugvid = document.querySelector('video[name="debug"]');
    codeReader.decodeFromStream(imgs,debugvid,(result,err)=>{
        if(err){
            console.debug(err);
        }
        if(!result) return;
        result = result.text;
        result = b45.decode(result);
        let header = new SplitHeader(result.buffer);
        console.log(`${header.page} of ${header.pages}`);
        let buf = new Uint8Array(result.buffer, header.SIZE);

        if(!stm){
            let size = MAXSIZE * header.pages;
            stm = new Uint8Array(size);
            progress.setAttribute('max',header.pages);
            indexcard = {
                id: header.idString,
                waiting: new Set([...Array(header.pages).keys()])
            };
        }
        let offset = MAXSIZE * header.page;
        stm.set(buf,offset);
        indexcard.waiting.delete(header.page);
        progress.value = indexcard.size;

        if(indexcard.waiting.size === 0){
            this.stopContinuousDecode();
            stm = new Blob([stm],{type:'application/epub+zip'});
            saveAs(stm,`${id}.epub`);
            button.disabled = false;
            for(let stylesheet of document.querySelectorAll('link[href="decode.css"]')){
                document.head.remove(stylesheet);
            }
        }
    });


}
