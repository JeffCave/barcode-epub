/**
 * https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
 */
export {
    Encode as default
};

import SplitHeader from "./lib/splitheader.js";
import * as b45 from './lib/base45.js';

const monochrome = true;
const bwipp = BWIPP();
const state = {
    canvas: null,
};

async function calcFileHash(buffer){
    let hash = await crypto.subtle.digest("SHA-512", buffer);
    return hash;
}

async function Download(){
    const response = await fetch('./book/thoreau.LifeWoods.epub');
    let buffer = await response.arrayBuffer();
    return buffer;
}

function Barcode(data){
    let cfg = {
        bcid: 'datamatrix',
        padding: 1,
        scaleX: 1,
        scaleY: 1
    };
    return new Promise((success,fail)=>{
        setTimeout(()=>{
            const bw = new BWIPJS(bwipjs_fonts, monochrome);
            bw.bitmap(new Bitmap(state.canvas.canvas));
            let scale = 1;
            let pad = 1;
            bw.scale(scale,scale);
            pad *= scale;
            bw.bitmap().pad(pad,pad);
            data = b45.encode(data);
            bwipp(bw, 'datamatrix', data, cfg);
            bwipjs_fonts.loadfonts(function(e) {
                if (e) {
                    fail(e);
                    return;
                }
                bw.render();

                //Apparently the parser wants a "white" border around the image. I'm annoyed by this, but ...
                let img = state.canvas.canvas.toDataURL();
                success(img);
            });
        },1);
    });
}

async function AppendBarcode(barcode,header){
    const main = document.querySelector('main');

    let img = document.createElement('img');
    img.setAttribute('title', `${header.page} of ${header.pages}`);

    img.addEventListener('click',Animate);

    main.append(img);
    //main.append(document.createTextNode('\n'));

    //img.transferFromImageBitmap(barcode);
    img.src = barcode;
    return img;
}


async function Process(stm){
    const header = new SplitHeader();

    //https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
    //const MAXSIZE = 1555-header.SIZE;
    const MAXSIZE = Math.floor(1555/b45.CompressionRatio)-header.SIZE;

    let progress = document.querySelector('progress[name="encode"]');
    progress.setAttribute('max',stm.byteLength);

    header.pages = Math.ceil(stm.byteLength / MAXSIZE);
    header.id = await calcFileHash(stm);
    for(let offset = 0; offset < stm.byteLength; offset+=MAXSIZE){
        let len = stm.byteLength - offset;
        len = Math.min(len, MAXSIZE);

        let chunk = new Uint8Array(stm,offset,len);
        let block = new Uint8Array(header.SIZE+len);
        block.set(header.p.bytes,0);
        block.set(chunk,header.SIZE);
        try{
            let barcode = await Barcode(block);
            await AppendBarcode(barcode,header);
        }
        catch(e){
            console.error(`BWIPP failed on ${header.page}`);
        }

        header.page++;
        progress.value = offset;
    }
}

function Animate(start=null){
    if(typeof start !== 'boolean'){
        start = null;
    }
    if(start === null){
        Animate(!state.animation);
    }
    else if (start === false && state.animation){
        clearInterval(state.animation);
        state.animation = null;
    }
    else if(start == true && !state.animation){
        state.lastshow = 0;
        state.animation = setInterval(()=>{
            let imgs = Array.from(document.querySelectorAll("main > img"));
            if(imgs.length == 0) return;

            imgs[state.lastshow].classList.remove('show');

            let i = (Date.now()/200) % imgs.length;
            i = Math.floor(i);
            imgs[i].classList.add('show');
            state.lastshow = i;
        },100);
    }
}

async function Encode(){
    state.canvas = document.querySelector('canvas').getContext('2d');
    document.querySelector('main').innerHTML = '';
    let stm = await Download();
    Animate(true);
    await Process(stm);
}
