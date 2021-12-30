'use strict';

export {
	psEpubList as default,
	psEpubList
};

import Barcoder from '../bcode/Barcoder.js';
import psThing from './psThing.js';

/**
 * A list of EPubs created by Barcoder
 *
 * Handles an infinite scroll of Barcoder elements. This is achieved by
 * loading a `pagesize` worth of data, and then dropping or adding that
 * many elements as is appropriate for scrolling.
 *
 * NOTE: I did this once for Fishalytics, it was a nice effect, may need
 * to steel some code.
 */
class psEpubList extends psThing {
	constructor() {
		super();
		this._.bcoder = null;
		this._.changehandler = (e)=>{this.Updator(e);};
		this._.shadow = this.attachShadow({mode:'open'});
		this._.shadow.innerHTML = psEpubList.DefaultTemplate;

		let shadow = this._.shadow;
		// for each of the buttons, add a handler
		let buttons = {
			'delete':()=>{this.barcoder.remove(this.selected);},
			'send':()=>{this.emit('send',this.selected);},
			'save':()=>{this.emit('save',this.selected);}
		};
		for(let b in buttons){
			let button = shadow.querySelector(`button[name="${b}"]`);
			button.addEventListener('click',buttons[b]);
		}
		// show or hide the buttons based on whether anything is selected or not
		this.addEventListener('change',(e)=>{
			if(e.detail.includes('barcoder')){
				this._.changehandler();
			}
			if(e.detail.includes('selected')){
				let items = shadow.querySelector('nav [name="selection"]');
				items.style.visibility = (this.selected.size === 0) ? 'hidden':'visible';
			}
		});
		// respond to file upload
		shadow.querySelector('ps-filedrop').addEventListener('change', (e)=>{
			this.barcoder.Save(e.target.files);
		});


		let style= document.createElement('style');
		shadow.append(style);
		style.textContent = this.initialCSS;

		// ensure the selection list is initialized
		this.initialize();
	}

	/**
	 * The underlying Barcoder object
	 */
	get barcoder(){
		return this._.bcoder;
	}
	set barcoder(bcoder){
		// if its the same one we already have, there is nothing to do
		if(this._.bcoder === bcoder) return;
		// as this is a new object, there is a lot of binding to do
		if(!(bcoder instanceof Barcoder)) throw new TypeError('value is not of type `Barcoder`');

		let old = this._.bcoder;
		if(old){
			old.removeEventListener('db',this._.changehandler);
		}
		bcoder.addEventListener('db',this._.changehandler);
		this._.bcoder = bcoder;
		this.emitChange('barcoder');
	}

	/**
	 * Record id that is the current focal point for the display
	 */
	get startat(){
		return this._.startat;
	}
	set startat(value){
		value = ~~value;
		if(value === this._.startat) return;

		this._.startat = value;
		this.setAttribute('startat',value);
		this.emitChange('startat');
	}

	/**
	 * Number of items to retain in memory for display purposes
	 */
	get pagesize(){
		return this._.pagesize;
	}
	set pagesize(value){
		value = ~~value;
		if(value === this._.pagesize) return;

		this._.pagesize = value;
		this.setAttribute('pagesize',value);
		this.emitChange('pagesize');
	}

	/**
	 * List of unique ids that are selected in the list
	 */
	get selected(){
		return this._.selected;
	}
	set selected(value){
		value = new Set(value);
		// test for change
		let changed = !this._.selected;
		if(!changed) changed = (value.size !== this._.selected.size);
		if(!changed){
			let a = JSON.stringify(value.values());
			let b = JSON.stringify(this._.selected.values());
			changed = (a === b);
		}
		if(!changed) return;
		// apply change
		this._.selected = value;
		this.emitChange('selected');
	}

	/**
	 * Initialize the data
	 */
	initialize(){
		this.selected = ['dummy'];
		this.selected = [];

		this.Updator();
	}

	/**
	 * Draws the library page.
	 */
	async Updator(){
		if(!this.barcoder) return;

		let db = this.barcoder.db;
		let htmlList = this._.shadow.querySelector('ul');
		let template = psEpubList.DefaultItem;
		let recs = await db.allDocs({include_docs:true,attachments: false});

		htmlList.innerHTML = '';
		for(let rec of recs.rows){
			rec = rec.doc;

			let html = document.createElement('li');
			html.innerHTML = template;

			let id = rec._id;
			let curpages = Object.keys(rec._attachments||{}).length;
			let pct = Math.floor(curpages/rec.pages*100);

			let checkbox = html.querySelector('input[type="checkbox"]');
			checkbox.checked = this.selected.has(id);
			checkbox.addEventListener('change',(e)=>{
				if(e.target.checked){
					this.selected.add(id);
				}
				else{
					this.selected.delete(id);
				}
				this.emitChange('selected');
			});


			html.querySelector('output[name="id"]').title = id;
			html.querySelector('output[name="id"]').value = [id.slice(0,4),'…',id.slice(-4)].join('');
			html.querySelector('output[name="pages-current"]').value = curpages;
			html.querySelector('output[name="pages-total"]').value   = rec.pages;
			html.querySelector('output[name="pages-pct"]').value	 = pct;

			html.querySelector('script[type="application/ld+json"]').textContent = JSON.stringify(rec.meta || {},null,'\t');
			if(rec.meta){
				html.querySelector('output[name="title"]').value = rec.meta.name;
				html.querySelector('output[name="author"]').value = rec.meta.author;

				let keywords = [];
				for(let k of rec.meta.keywords){
					let li = `<li>${k}</li>`;
					keywords.push(li);
				}
				keywords = keywords.join('');
				html.querySelector('ul[name="keywords"]').innerHTML = keywords;
			}

			htmlList.append(html);
		}
	}

	/**
	 * Handles a change to the observed atttibutes
	 *
	 * @param {string} name
	 * @param {*} oldValue
	 * @param {*} newValue
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		if(name in this){
			this[name] = newValue;
		}
	}

	/**
	 * The initial CSS that should be applied.
	 */
	get initialCSS(){
		return [
			super.initialCSS||'',
			psEpubList.DefaultCSS
		].join('\n');
	}

	static get observedAttributes() {
		return ['pagesize', 'startat'];
	}

	static get DefaultTemplate(){
		return `
<nav>
 <ps-filedrop id='UploadEpub' class='mainaction' accept='.epub,.gif' title='Upload an EPub'>➕</ps-filedrop>
 <span name='selection'>
  <button name='send' title='Encode'>🙾</button>
  <button name='save' title='Save to Disk'>🖫</button>
  <button name='delete'title='Delete'>🗑</button>
 </span>
</nav>
<ul></ul>
	   `;

	}

	static get DefaultItem(){
		return `
<nav>
 <input type='checkbox' />
 <button name='record'>⏸</button>
</nav>
<script type="application/ld+json"></script>
<div><output name='id'>xxx...xxx</output></div>
<div><output name='pages-current'>?</output> of <output name='pages-total'>?</output> (<output name='pages-pct'>100</output>%)</div>
<div><label>Title</label>: <output name='title'>???</output></div>
<div><label>Author</label>: <output name='author'>???</output></div>
<ul name='keywords'></ul>
		`;
	}

	static get DefaultCSS(){
		return `
button {
	min-width: 48px;
	min-height: 48px;
}
.mainaction{
	position: absolute;
	bottom: 2.5em;
	left: 2.5em;
	box-shadow: 0.25em 0.25em 0.25em darkgray;
	z-index:10;
}
:host{
	flex: 1 0 auto;
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
}
:host > nav {
	flex: 0 0 auto;
	background-color: var(--main-color);
	top:0;
	left:0;
	width:100vw;
}
:host > ul {
	flex: 1 0 auto;
	overflow-y: scroll;
	overflow-x: scroll;
    padding:0;
    margin:0;
}
:host > ul > li {
    border: 0.1em solid black;
    background-color: ivory;
    display:block;
    padding: 1em;
    border-radius: 1em;
	margin:0.5em;
	position: relative;
}
ul[name='keywords'] {
	display: block;
	flex-wrap: wrap;
	list-style-type: none;
	margin: 0;
	padding: 0;
}
ul[name='keywords'] li {
	display:inline-block;
	padding:0.5em;
	margin-right:1em;
	background-color: salmon;
	border-radius: 1em;
	line-height:1.5em;
}
		`;
	}

}



try{
	window.customElements.define('ps-epublist',psEpubList);
	/* global Vue */
	if(Vue && !Vue.config.ignoredElements.includes('ps-epublist')){
		Vue.config.ignoredElements.push('ps-epublist');
	}
}
// eslint-disable-next-line
catch(err){}
