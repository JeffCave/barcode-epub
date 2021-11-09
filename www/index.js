import {Encode,Animate} from "./encoder.js";
import Decode from "./decoder.js";

window.addEventListener('load',()=>{
    let buttons = {
        'button[name="encode"]': encode,
        'button[name="decode"]': ()=>{decode('monitor');},
        'button[name="fromCamera"]': ()=>{decode('camera');},
        'button[name="print"]': ()=>{window.print();},
        'header nav button[name="left"]' : ()=>{page(-1);},
        'header nav button[name="right"]': ()=>{page(+1);},
    };
    for(let b in buttons){
        document.querySelector(b).addEventListener('click',buttons[b]);
    }
    page(0);
});

function decode(src='monitor'){
	let stylesheet = document.createElement('link');
	stylesheet.setAttribute('rel','stylesheet');
	stylesheet.setAttribute('type','text/css');
	stylesheet.setAttribute('href','decode.css');
	//document.head.append(stylesheet);

    let status = document.querySelector('.status');
	let button = document.querySelector('button[name="decode"]');
	let progress = document.querySelector('progress[name="decode"]');

	button.disabled = true;

    Decode(src,{
        status:status,
        progress:progress
    });

    button.disabled = false;
    for(let stylesheet of document.querySelectorAll('link[href="decode.css"]')){
        document.head.remove(stylesheet);
    }
}

function encode(){
    let progress = document.querySelector('progress[name="encode"]');
	let button = document.querySelector('button[name="encode"]');
	button.disabled = true;

	document.querySelector('main').innerHTML = '';
    Animate(true,'main > img')
    Encode(progress);
	button.disabled = false;
}


function page(dir=1){
    let pages = document.querySelector('main');
    
    // wraps the pointer to a positive value within the array
    dir %= pages.children.length;
    dir += pages.children.length;
    dir %= pages.children.length;

    let page = pages.children[dir];
    while(page.dataset.page !== pages.children[0].dataset.page){
        if(dir > 0){
            pages.prepend(pages.children[pages.children.length-1]);
        }
        else{
            pages.append(pages.children[0]);
        }
    }
}

