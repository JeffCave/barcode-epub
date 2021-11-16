import "https://cdnjs.cloudflare.com/ajax/libs/pouchdb/7.0.0/pouchdb.min.js";

import "./lib/widgets/psFileDrop.js";

import * as Encoder from "./encoder.js";
import * as Decoder from "./decoder.js";
import SplitHeader from "./lib/bcode/splitheader.js";

let db = new PouchDB('barcodelib');

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
	let sections = Array.from(document.querySelectorAll('article[data-page="library"] section'));
    for(let sect of sections){
        sect.classList.add('hide');
    }
    let sect = document.querySelector('article[data-page="library"] section[name="file"]');
    sect.classList.remove('hide');
}


async function VideoDecode(src='monitor'){
    let buttons = Array.from(document.querySelectorAll('article[data-page="decoder"] button'));
    let stopButton = document.querySelector('article[data-page="decoder"] button[name="stop"]');
    let videosection = document.querySelector('article[data-page="decoder"] section[name="video"]');

    buttons.forEach(b=>{b.classList.add('hide')});
    stopButton.classList.remove('hide');
    videosection.classList.remove('hide');
    page('decoder');

    await Decoder.WatchVideo(src);

    stopCamera();
}


function stopCamera(){
    Decoder.StopVideo();
    let buttons = Array.from(document.querySelectorAll('article[data-page="decoder"] button'));
    let stopButton = document.querySelector('article[data-page="decoder"] button[name="stop"]');
    let videosection = document.querySelector('article[data-page="decoder"] section[name="video"]');
    buttons.forEach(b=>{b.classList.remove('hide')});
    stopButton.classList.add('hide');
    videosection.classList.add('hide');
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
    let pages = document.querySelector('main');
    
    if(typeof dir === 'string'){
        /*
        * Find the string in the page labels. If you don't find it, just assume no page change
        */
        let label = dir;
        for(dir=pages.children.length-1;dir>0;dir--){
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

