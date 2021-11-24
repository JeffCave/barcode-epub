
export{
    ePub as default,
    ePub
}

class ePub{
    constructor(){
        this.parts = new Map();
    }

    static async calcFileHash(buffer){
        buffer = await buffer;
        if(buffer instanceof ArrayBuffer){
            buffer = new Uint8Array(buffer);
        }
        let hash = await crypto.subtle.digest(this._.hash, buffer);
        return hash;
    }

    async calcFileHash(){
        let hash = ePub.calcFileHash(this.buffer);
        return hash;
    }

}
