import "https://cdnjs.cloudflare.com/ajax/libs/pouchdb/7.0.0/pouchdb.min.js";
import "./lib/lib/pouchdb.upsert.min.js";
import * as b45 from './lib/base45.js';

import "./lib/widgets/psFileDrop.js";

import {Encode,Animate} from "./encoder.js";
import * as Encoder from "./encoder.js";
import Decode from "./decoder.js";

let db = new PouchDB('barcodelib');

window.addEventListener('load',()=>{

    db.changes({since:'now',live:true}).on('change', RenderIndex);
    RenderIndex();

    let buttons = {
        'button[name="encode"]': encode,
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


function encode(){
    let progress = document.querySelector('progress[name="encode"]');
	let button = document.querySelector('button[name="encode"]');
	button.disabled = true;

	let imgcontainer = document.querySelector('div[name="codeset"]');
    imgcontainer.innerHTML = '';
    Animate(true,imgcontainer);
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

        html.querySelector('output[name="id"]').title = id;
        html.querySelector('output[name="id"]').value = [id.slice(0,4),'…',id.slice(-4)].join('');
        html.querySelector('output[name="progress"]').value = rec.progress;
        html.querySelector('output[name="title"]').value = rec.title;

        htmlList.append(html);
    }
}

