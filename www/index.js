import "https://cdnjs.cloudflare.com/ajax/libs/pouchdb/7.0.0/pouchdb.min.js";
import "./lib/lib/pouchdb.upsert.min.js";
import * as b45 from './lib/base45.js';

import "./lib/widgets/psFileDrop.js";

import * as Encoder from "./encoder.js";
import Decode from "./decoder.js";
import SplitHeader from "./lib/bcode/splitheader.js";

let db = new PouchDB('barcodelib');

window.addEventListener('load',()=>{

    db.changes({since:'now',live:true}).on('change', RenderIndex);
    RenderIndex();

    let buttons = {
        'button[name="decode"]': ()=>{decode('monitor');},
        'button[name="fromCamera"]': ()=>{decode('camera');},
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

    let UploadEpub = document.querySelector('#UploadEpub');
    UploadEpub.addEventListener('change', async (e)=>{
        let files = e.target.files;
        let updates = [];
        for(let file of files){
            let buff = await file.arrayBuffer();
            let hash = await Encoder.calcFileHash(buff);
            hash = new Uint8Array(hash);
            hash = b45.encode(hash);
            hash = hash.replace(/=/g,'');
            let update = db.upsert(hash,(doc)=>{
                if(!('_id' in doc)){
                    doc = {
                        _id:hash,
                        progress:0,
                    }
                }
                if(doc.progress === 1){
                    return null;
                }
                doc.progress = 1;
                doc._attachments = {
                    'document': {
                      content_type: file.type,
                      data: file
                    }
                }
                return doc;
            });
            updates.push(update);
        }
        await Promise.all(updates);
    });

});

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


function upload(){
	let buttons = Array.from(document.querySelectorAll('article[data-page="decoder"] button'));
	let sections = Array.from(document.querySelectorAll('article[data-page="decoder"] section'));
	let sect = document.querySelector('article[data-page="decoder"] section[name="file"]');

	buttons.forEach(b=>{b.disabled = true});
	sections.forEach(s=>{s.classList.add('hide');});
    sect.classList.remove('hide');
	buttons.forEach(b=>{b.disabled = false});
}


async function decode(src='monitor'){
    let status = document.querySelector('.status');
	let buttons = Array.from(document.querySelectorAll('article[data-page="decoder"] button'));
	let sections = Array.from(document.querySelectorAll('article[data-page="decoder"] section'));
	let progress = document.querySelector('progress[name="decode"]');
	let sect = document.querySelector('article[data-page="decoder"] section[name="video"]');

	buttons.forEach(b=>{b.disabled = true});
	sections.forEach(s=>{s.classList.add('hide');});
    sect.classList.remove('hide');

    await Decode(src,{
        status:status,
        progress:progress
    });

	buttons.forEach(b=>{b.disabled = false});
    for(let stylesheet of document.querySelectorAll('link[href="decode.css"]')){
        document.head.remove(stylesheet);
    }
}


async function encode(id = null){
    if (!id) return;

    let rec = await db.get(id,{
        attachments: true,
        binary: true
    });

    let progress = document.querySelector('progress[name="encode"]');
    let imgcontainer = document.querySelector('div[name="codeset"]');
    imgcontainer.innerHTML = '';
    page(1);
    
    let buff = await rec._attachments.document.data.arrayBuffer();
    for await (let block of Encoder.Process(buff,progress)){
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
    let pages = document.querySelector('main');
    
    if(typeof dir === 'string'){
        /*
        * Find the string in the page labels. If you don't find it, just assume no page change
        */
        let label = dir;
        for(dir=pages.length-1;dir>0;dir--){
            let page = pages.children[dir];
            if(page.dataset.page === label){
                break;
            }
        }
    }

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

async function RenderIndex(){
    let htmlList = document.querySelector('article[data-page="library"] > ul');
    let template = document.querySelector('article[data-page="library"] > template');
    let recs = await db.allDocs({include_docs:true,attachments: false});

    htmlList.innerHTML = '';
    for(let rec of recs.rows){
        rec = rec.doc;
        let html = document.createElement('li');
        html.innerHTML = template.innerHTML;

        let id = rec._id;
        let rev = rec._rev;

        html.querySelector('button[name="delete"]').addEventListener('click',()=>{db.remove(id,rev);});
        html.querySelector('button[name="send"]').addEventListener('click',()=>{encode(id);});

        html.querySelector('output[name="id"]').title = id;
        html.querySelector('output[name="id"]').value = [id.slice(0,4),'…',id.slice(-4)].join('');
        html.querySelector('output[name="progress"]').value = rec.progress;
        html.querySelector('output[name="title"]').value = rec.title;

        htmlList.append(html);
    }
}

