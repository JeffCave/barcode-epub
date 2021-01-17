
/**
 * https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
 */
export {
    Encode as default
};


const monochrome = true;
const bwipp = BWIPP();
const state = {
    canvas: null
};

async function Download(){
    const response = await fetch('./book/thoreau.LifeWoods.epub');
    let buffer = await response.arrayBuffer();
    return buffer;
}

async function Barcode(data){
    let cfg = {
        bcid: 'datamatrix',
        includetext: false,
        padding: 1,
        scaleX: 1,
        scaleY: 1
    };
    return new Promise((success,fail)=>{
        setTimeout(()=>{
            const bw = new BWIPJS(bwipjs_fonts, monochrome);
            bw.bitmap(new Bitmap(state.canvas.canvas));
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

async function AppendBarcode(barcode){
    const main = document.querySelector('main');

    //let img = document.createElement('canvas');
    let img = document.createElement('img');

    img.setAttribute('height', barcode.height);
    img.setAttribute('width', barcode.width);

    main.append(img);
    main.append(document.createTextNode('\n'));

    //img.transferFromImageBitmap(barcode);
    img.src = barcode;
}

async function Process(stm){
    //https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
    const MAXSIZE = 1550;

    let progress = document.querySelector('progress');
    progress.setAttribute('max',stm.byteLength);

    for(let offset = 0; offset < stm.byteLength; offset+=MAXSIZE){
        let len = stm.byteLength - offset;
        len = Math.min(len, MAXSIZE);

        let arr = new Uint8Array(stm,offset,len);
        arr = String.fromCharCode(...arr);
        let barcode = await Barcode(arr);
        await AppendBarcode(barcode);

        progress.value = offset;
    }
}

async function Encode(){
    state.canvas = document.querySelector('canvas').getContext('2d');
    document.querySelector('main').innerHTML = '';
    let stm = await Download();
    await Process(stm);
}
