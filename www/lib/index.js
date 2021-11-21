import "https://cdnjs.cloudflare.com/ajax/libs/pouchdb/7.0.0/pouchdb.min.js";

import "./bwip-js/bwipp.js";
import "./bwip-js/bwipjs.js";
import "./bwip-js/lib/xhr-fonts.js";
import "./bwip-js/lib/bitmap.js";
import "./zxing.js";

import "./widgets/~all.js";

import * as Encoder from "../encoder.js";
import * as Decoder from "../decoder.js";
import SplitHeader from "./bcode/splitheader.js";

const db = new PouchDB('barcodelib');
db.compact();
let style = null;

window.addEventListener('load',()=>{

    db.changes({since:'now',live:true}).on('change', RenderIndex);
    RenderIndex();

    let buttons = {
        'button[name="fromVideo"]': ()=>{VideoDecode('monitor');},
        'button[name="fromCamera"]': ()=>{VideoDecode('camera');},
        'button[name="stop"]': ()=>{stopCamera();},
        'button[name="print"]': ()=>{window.print();},
        'button[name="fromEpub"]': ()=>{upload();},
        'header nav button[name="left"]' : ()=>{page(-1);},
        'header nav button[name="right"]': ()=>{page(+1);},
    };
    for(let b in buttons){
        document.querySelector(b).addEventListener('click',buttons[b]);
    }
    page(0);
    Animate(true,document.querySelector('div[name="codeset"]'));

    document
        .querySelector('#UploadEpub')
        .addEventListener('change', (e)=>{
            LoadFiles(e.target.files)
        });

    style = document.createElement('style');
    document.head.append(style);
    style  = style.sheet;

    style.insertRule('.preload{display:none}');
    Array.from(document.querySelectorAll('.waitload')).forEach(d=>{
        d.classList.remove('waitload');
    });
});


function applyAttach(attach,page,block){
    if(page in attach) return;
    if(!(page in attach)){
        attach[page] = {
            content_type: 'application/dpub-seg',
            data: new Blob([block.buffer])
        };
    }
}


async function LoadFiles(files){
    if(files instanceof File){
        files = [files];
    }
    let updates = [];
    for(let file of files){
        let buff = await file.arrayBuffer();
        let blocks = Encoder.Process(buff);
        let block = (await blocks.next()).value;
        let header = new SplitHeader(block);
        let doc = null;
        try{
            doc = await db.get(header.idString,{attachments:true,binary:true});
        }
        catch(e){
            if(e.status === 404){
                doc = {
                    _id: header.idString,
                    pages: header.pages,
                    _attachments:{}
                };
            }
            else{
                throw e;
            }
        }
        let pages = Object.keys(doc._attachments).length;
        if(pages === doc.pages){
            return null;
        }

        applyAttach(doc._attachments,header.page.toFixed(0),block);
        for await (let block of blocks){
            let header = new SplitHeader(block);
            applyAttach(doc._attachments,header.page.toFixed(0),block);
        }
        let update = db.put(doc);
        updates.push(update);
    }
    await Promise.all(updates);
}

let animator = {};
function Animate(start=null,container=animator.container){
	const ANIM_SPEED = 2000;
	//const ANIM_SPEED = 750;
	if(typeof start !== 'boolean'){
		start = null;
	}
	if(start === null){
		Animate(!animator.animation);
	}
	else if (start === false && animator.animation){
		clearInterval(animator.animation);
		animator.animation = null;
	}
	else if(start == true && !animator.animation){
		animator.lastshow = 0;
		animator.container = container;

		let changeslide = ()=>{
			let imgs = Array.from(animator.container.querySelectorAll('img'));
			if(imgs.length == 0) return;

			imgs[animator.lastshow].classList.remove('show');

			let i = (Date.now()/ANIM_SPEED) % imgs.length;
			i = Math.floor(i);
			imgs[i].classList.add('show');
			animator.lastshow = i;
		};

		animator.animation = setInterval(changeslide,ANIM_SPEED);
		changeslide();
	}
}


function upload(visible=null){
    let page = document.querySelector('ps-panel[name="library"]');
	let sections = Array.from(page.querySelectorAll('section'));
    for(let sect of sections){
        sect.classList.add('hide');
    }
    let sect = page.querySelector('section[name="file"]');
    sect.classList.remove('hide');
}


let VideoStatus_Clearer = null;
function VideoStatus(status){
    let led = document.querySelector('.status');

    clearTimeout(VideoStatus_Clearer);
    // set the status
    window.navigator.vibrate(200);
    led.classList.add(status);
    // let it take effect
    VideoStatus_Clearer = setTimeout(() => {
        VideoStatus_Clearer = null;
        // then remove it, so that it fades away
        led.classList.remove('pass','fail','warn','skip');
    });
}


async function VideoDecode(src='monitor'){
    let buttons = Array.from(document.querySelectorAll('article[data-page="decoder"] button'));
    let stopButton = document.querySelector('article[data-page="decoder"] button[name="stop"]');

    buttons.forEach(b=>{b.classList.add('hide')});
    stopButton.classList.remove('hide');
    page('decoder');

    await Decoder.WatchVideo(src,VideoStatus);

    stopCamera();
}


function stopCamera(){
    Decoder.StopVideo();
    let buttons = Array.from(document.querySelectorAll('article[data-page="decoder"] button'));
    let stopButton = document.querySelector('article[data-page="decoder"] button[name="stop"]');
    buttons.forEach(b=>{b.classList.remove('hide')});
    stopButton.classList.add('hide');
}


async function encode(id = null){
    if (!id) return;

    let rec = await db.get(id,{
        attachments: true,
        binary: true
    });

    let imgcontainer = document.querySelector('div[name="codeset"]');
    imgcontainer.innerHTML = '';
    page(1);

    for (let block of Object.values(rec._attachments)){
        block = await block.data.arrayBuffer();
        block = new Uint8Array(block);
        let header = new SplitHeader(block);
        let barcode = await Encoder.Barcode(block);
        let img = document.createElement('img');
        img.setAttribute('alt', `${header.page} of ${header.pages} - ${header.idString}`);
        //img.transferFromImageBitmap(barcode);
        img.src = barcode;
        imgcontainer.append(img);
    }

}


/**
 * Changes the visible page to the specified page.
 *
 * Page can be specified as a string or an integer. A string specifies
 * the absolute page name to be changed to, integers represent the number
 * of page to move by from current position.
 *
 * The pages are conceptually in a carosel, so negative numbers move left,
 * postive numbers move right.
 *
 * Nonsensical values result in a page move of 0 (stay where you are)
 *
 * @param {int|string} dir
 */
function page(dir=1){
    let pages = document.querySelector('ps-tabpanel');
    pages.rotate(dir);
}


async function Download(id){
    let rec = await db.get(id,{include_docs:true,attachments:true,binary:true});
    let attachments = Object.values(rec._attachments);
    if(rec.pages !== attachments.length){
        return null;
    }
    let buff = [];
    for(let d of attachments){
        let buf = await d.data.arrayBuffer();
        buf = new Uint8Array(buf, SplitHeader.SIZE);
        buff.push(buf);
    }
    let stm = new Blob(buff,{type:'application/epub+zip'});
    saveAs(stm,`${id}.epub`);
}


async function RenderIndex(){
    let page = document.querySelector('ps-panel[name="library"]');
    let htmlList = page.querySelector('ul');
    let template = page.querySelector('template');
    let recs = await db.allDocs({include_docs:true,attachments: false});

    htmlList.innerHTML = '';
    for(let rec of recs.rows){
        rec = rec.doc;
        let html = document.createElement('li');
        html.innerHTML = template.innerHTML;

        let id = rec._id;
        let rev = rec._rev;
        let curpages = Object.keys(rec._attachments||{}).length;
        let pct = Math.floor(curpages/rec.pages*100);

        html.querySelector('button[name="delete"]').addEventListener('click',()=>{db.remove(id,rev);});
        html.querySelector('button[name="send"]').addEventListener('click',()=>{encode(id);});
        html.querySelector('button[name="save"]').addEventListener('click',()=>{Download(id);});

        html.querySelector('output[name="id"]').title = id;
        html.querySelector('output[name="id"]').value = [id.slice(0,4),'…',id.slice(-4)].join('');
        html.querySelector('output[name="pages-current"]').value = curpages;
        html.querySelector('output[name="pages-total"]').value   = rec.pages;
        html.querySelector('output[name="pages-pct"]').value     = pct;
        html.querySelector('output[name="title"]').value = rec.title;

        htmlList.append(html);
    }
}

