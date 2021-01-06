/**
 * Given A4 paper is 21 x 29.7cm and it is important to leave enough
 * margin for binding (and hole punching), an optimal size appears to
 * be 5 across (@3.4x3.4 cm each)
 *
 * Splitting: 4 bytes for a protocol identifier + 64bytes for a UID (sha512) + 2 bytes for sequence ID + 2 bytes for total packages
 * 72 bytes total
 */

const bwipjs = require('bwip-js');
const fs = require('fs');
const { debugPort } = require('process');

async function ProcessChunk(chunk,i){
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
}

class SplitHeader {
    constructor(buffer=null){
        let p = {};
        if(!buffer){
            buffer = Buffer.alloc(SplitHeader.SIZE);
            // First two bytes are going to spell "dp" for "dpub"
            let bytes = new Uint8Array(buffer.buffer,0);
            'dp'.split('')
                .forEach((d,i)=>{
                    bytes[i] = d.charCodeAt(0);
                });
        }
        p.buffer = buffer;
        p.bytes = new Uint8Array(buffer.buffer,0);
        p.id = new Uint8Array(buffer.buffer,4,64);
        p.page = new Uint16Array(buffer.buffer,68,2);
        this.p = p;
    }

    calcChecksum(){
        let sum = 'A'.charCodeAt(0);
        for(let i=this.p.bytes-1; i>2; i--){
            let byte = this.p.bytes[i];
            sum += byte;
            sum = (sum - (sum / 0xFF)) % 0xFF;
        }
        return sum;
    }

    setCheck(){
        this.p.bytes[2] = this.calcChecksum();
        return this.p.bytes[2];
    }

    get header(){
        return bytes;
    }

    get version(){
        return this.p.bytes[2];
    }
    set version(value){
        value = value || 0;
        value = ~~value; // abs-numeric
        this.p.bytes[2] = value;
    }

    get checksum(){
        return this.p.bytes[3];
    }

    get id(){
        let id = this.p.id[0];
        return id;
    }
    set id(value){
        for(let i=Math.min(value.length,this.p.id.length)-1; i>=0; i--){
            this.p.id[i] = value[i];
        }
        this.setCheck();
    }
    get page(){
        return this.p.page[0];
    }
    set page(value){
        value = value || 0;
        value = ~~value; // abs-numeric
        this.p.page[0] = value;
        this.setCheck();
    }
    get pages(){
        return this.p.page[1];
    }
    set pages(value){
        value = value || 0;
        value = ~~value; // abs-numeric
        this.p.page[1] = value;
        this.setCheck();
    }
    get buffer(){
        return this.p.buffer;
    }

    get SIZE(){
        return SplitHeader.SIZE;
    }
}
SplitHeader.SIZE = 72;


function main(){

    //https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
    const header = new SplitHeader();
    let MAXSIZE = 1556-header.SIZE;
    let testfile = './www/book/thoreau.LifeWoods.epub';
    let fsize = fs.statSync(testfile);
    header.pages = Math.ceil(fsize.size / MAXSIZE);
    const stmIn = fs.createReadStream(testfile, {highWaterMark: MAXSIZE});
    header.id = 0;
    stmIn.on( 'data' , (chunk)=>{
        chunk = Buffer.concat([header.buffer,chunk]);
        ProcessChunk(chunk,header.page);
        header.page++;
    } );
}

main();
