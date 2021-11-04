import Encode from "./encoder.js";
import Decode from "./decoder.js";

window.addEventListener('load',()=>{
    //const canvas = new OffscreenCanvas(1, 1);
    document.querySelector('button[name="encode"]').addEventListener('click',Encode);
    document.querySelector('button[name="decode"]').addEventListener('click',decode);
    document.querySelector('button[name="fromCamera"]').addEventListener('click',decodeFromCamera);
    document.querySelector('button[name="print"]').addEventListener('click',()=>{window.print();});
});

function decode(){
	let stylesheet = document.createElement('link');
	stylesheet.setAttribute('rel','stylesheet');
	stylesheet.setAttribute('type','text/css');
	stylesheet.setAttribute('href','decode.css');
	//document.head.append(stylesheet);

    Decode('monitor');

    button.disabled = false;
    for(let stylesheet of document.querySelectorAll('link[href="decode.css"]')){
        document.head.remove(stylesheet);
    }
}
function decodeFromCamera(){
	let stylesheet = document.createElement('link');
	stylesheet.setAttribute('rel','stylesheet');
	stylesheet.setAttribute('type','text/css');
	stylesheet.setAttribute('href','decode.css');
	//document.head.append(stylesheet);

    Decode('camera');

    button.disabled = false;
    for(let stylesheet of document.querySelectorAll('link[href="decode.css"]')){
        document.head.remove(stylesheet);
    }
}
