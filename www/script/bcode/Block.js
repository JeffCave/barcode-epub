//import "../lib/bwip-js/bwipp.js";
//import "../lib/bwip-js/bwipjs.js";
//import "../lib/bwip-js/lib/xhr-fonts.js";
//import "../lib/bwip-js/lib/bitmap.js";

import BlockHeader from "./BlockHeader.js";
import * as b45 from "../base45.js";

export{
    Block as default,
    Block
}

const monochrome = true;
const bwipp = BWIPP();
const state = {
	canvas: null,
	context: null,
};

class Block extends Uint8Array{
    constructor(buffer,offset=0){
        if(!buffer){
            super(Block.MaxSize+BlockHeader.SIZE);
        }
        else{
            super(buffer,offset,Block.MaxSize+BlockHeader.SIZE);
        }
        this.p = {};
    }

    get header(){
        if(!this.p.header){
            this.p.header = new BlockHeader(this);
        }
        return this.p.header;
    }

    set header(head){
        if(!(head instanceof BlockHeader)) throw TypeError('Not an instance of a SplitHeader');
        head.buffer
    }

    get body(){
        if(this.p.body) return this.p.body;
        this.p.body = Uint8Array(this,this.header.SIZE+1);
        return this.p.body;
    }

    get raw(){
        if(this.p.raw) return this.p.raw;
        this.p.raw = b45.decode(result);
        return this.p.raw;
    }

    toImage(){
        let data = this.raw;
        if(!state.context){
            // this should be an offscreen canvas
            //state.canvas = document.querySelector('canvas').getContext('2d');
            if(window.OffscreenCanvas){
                state.canvas = new OffscreenCanvas(146, 146);
            }
            else{
                state.canvas = document.createElement('canvas');
                state.canvas.height = 146;
                state.canvas.width = state.canvas.height;
                state.canvas.style.opacity = 0;
                document.body.append(state.canvas);
            }
            state.context = state.canvas.getContext('2d');
        }

        let cfg = {
            //bcid: 'datamatrix',
            bcid: 'qrcode',
            padding: 1,
            scaleX: 2,
            scaleY: 2
        };
        return new Promise((success,fail)=>{
            setTimeout(()=>{
                const bw = new BWIPJS(bwipjs_fonts, monochrome);
                bw.bitmap(new Bitmap(state.context.canvas));
                let scale = 2;
                let pad = 10;
                bw.scale(scale,scale);
                pad *= scale;
                bw.bitmap().pad(pad,pad);
                data = b45.encode(data);
                bwipp(bw, cfg.bcid, data, cfg);
                bwipjs_fonts.loadfonts(async function(e) {
                    if (e) {
                        fail(e);
                        return;
                    }
                    bw.render();

                    //Apparently the parser wants a "white" border around the image. I'm annoyed by this, but ...
                    let img = state.context.canvas;
                    if('toDataURL' in img){
                        img = img.toDataURL();
                        success(img);
                    }
                    else{

                        const reader = new FileReader();
                        reader.addEventListener("load", function () {
                            success(reader.result);
                        }, false);
                        img = await img.convertToBlob();
                        reader.readAsDataURL(img);
                    }
                });
            },1);
        });
    }

}

Block.MaxSize = Math.floor(1555/b45.CompressionRatio)-BlockHeader.SIZE;;
