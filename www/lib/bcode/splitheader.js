class SplitHeader {
    constructor(buffer=null){
        let p = {};
        if(!buffer){
            buffer = new ArrayBuffer(SplitHeader.SIZE);
            // First two bytes are going to spell "dp" for "dpub"
            let bytes = new Uint8Array(buffer,0);
            'dp'.split('')
                .forEach((d,i)=>{
                    bytes[i] = d.charCodeAt(0);
                });
        }
        else {
            if(buffer.buffer){
                buffer = buffer.buffer;
            }
            if(buffer instanceof ArrayBuffer){

            }
            else if(Array.isArray(buffer)){
                buffer = new Uint8Array(buffer);
                buffer = buffer.buffer;
            }
        }
        p.buffer = buffer;
        p.bytes = new Uint8Array(buffer,0);
        p.id = new Uint8Array(buffer,4,64);
        p.page = new Uint16Array(buffer,68,2);
        this.p = p;

        this.version = 0;
    }

    isValid(){
        if(this.bytes[0] !== 'p' && this.bytes[1] !== 'd'){
            return false;
        }

        if(this.version !== 0){
            return false;
        }

        let actual = this.calcChecksum();
        let expect = this.checksum;
        if(actual !== expect){
            return false;
        }

        return true;
    }

    calcChecksum(){
        let sum = 'U'.charCodeAt(0);
        for(let i=4; i<this.p.bytes.length; i++){
            sum += this.p.bytes[i];
            sum += Math.floor(sum / 256);
            sum %= 256;
        }
        return sum;
    }

    setCheck(){
        this.p.bytes[3] = this.calcChecksum();
        return this.p.bytes[3];
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
        let id = this.p.id;
        return id;
    }
    set id(value){
        value = new Uint8Array(value);
        for(let i=Math.min(value.length,this.p.id.length)-1; i>=0; i--){
            this.p.id[i] = value[i];
        }
        this.setCheck();
    }

    get idString(){
        let id = this.p.id;
        id = String.fromCharCode(... id);
        id = window.btoa(id);
        return id;
    }
    set idString(id){
        id = window.atob(id);
        id = id.split('').map(d=>{
            d = d.charCodeAt(0);
            return d;
        });
        id = new Uint8Array(id);
        this.id = id;
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
        return 72;
    }
}
SplitHeader.SIZE = 72;

export {
    SplitHeader as default,
    SplitHeader
};
