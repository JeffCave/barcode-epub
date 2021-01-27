import Encode from "./encoder.js";
import Decode from "./decoder.js";

window.addEventListener('load',()=>{
    //const canvas = new OffscreenCanvas(1, 1);
    document.querySelector('button[name="encode"]').addEventListener('click',Encode);
    document.querySelector('button[name="decode"]').addEventListener('click',Decode);
    document.querySelector('button[name="print"]').addEventListener('click',()=>{window.print();});
});
