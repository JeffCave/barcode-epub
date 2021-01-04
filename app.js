/**
 * Given A4 paper is 21 x 29.7cm and it is important to leave enough
 * margin for binding (and hole punching), an optimal size appears to
 * be 5 across (@3.4x3.4 cm each)
 */

const bwipjs = require('bwip-js');
const fs = require('fs');

function main(){
    //https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
    const MAXSIZE = 1550;
    const stmIn = fs.createReadStream('./www/book/thoreau.LifeWoods.epub', {highWaterMark: MAXSIZE});
    let i = 0;
    stmIn.on('data', async (chunk)=>{
        let arr = new Uint8Array(chunk);
        arr = String.fromCharCode(...arr);
        let png = await bwipjs.toBuffer({
            bcid: 'datamatrix',
            text: arr,
            //scale: 3,
            //height: 10, width: 10, // in millimeters
            includetext: false,
            textxalign:  'center',
        });
        fs.writeFileSync(`./encoded/s${i}.png`, png,  "binary");
        i++;
    });
}

main();
