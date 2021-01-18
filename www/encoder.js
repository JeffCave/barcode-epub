/**
 * Given A4 paper is 21 x 29.7cm and it is important to leave enough
 * margin for binding (and hole punching), an optimal size appears to
 * be 5 across (@3.4x3.4 cm each)
 *
 * Splitting: 4 bytes for a protocol identifier + 64bytes for a UID (sha512) + 2 bytes for sequence ID + 2 bytes for total packages
 * 72 bytes total
 */
/**
 * https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
 */
export {
    Encode as default
};

import SplitHeader from "./lib/splitheader.js";


const monochrome = true;
const bwipp = BWIPP();
const state = {
    canvas: null
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
            data = String.fromCharCode(...data);
            bwipp(bw, 'datamatrix', data, cfg);
            bwipjs_fonts.loadfonts(function(e) {
                if (e) {
                    fail(e);
                    return;
                }
                bw.render();

                //Apparently the parser wants a "white" border around the image. I'm annoyed by this, but ...
                let ctx = state.canvas;
                let img = state.canvas.getImageData(0,0,ctx.canvas.height,ctx.canvas.width);
                ctx.canvas.height += 2 * 2;
                ctx.canvas.width += 2 * 2;
                state.canvas.putImageData(img, 2, 2);
                ctx.rect (0,0,ctx.canvas.height,ctx.canvas.width);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 4;
                ctx.stroke();

                img = state.canvas.canvas.toDataURL();
                success(img);
            });
        },1);
    });
}

async function AppendBarcode(barcode,header){
    const main = document.querySelector('main');

    let img = document.createElement('img');
    img.setAttribute('title', `${header.page} of ${header.pages}`);
    main.append(img);
    main.append(document.createTextNode('\n'));

    //img.transferFromImageBitmap(barcode);
    img.src = barcode;
}


async function Process(stm){
    const header = new SplitHeader();

    //https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
    const MAXSIZE = 1556-header.SIZE;

    let progress = document.querySelector('progress');
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

async function Encode(){
    state.canvas = document.querySelector('canvas').getContext('2d');
    document.querySelector('main').innerHTML = '';
    let stm = await Download();
    await Process(stm);
}
