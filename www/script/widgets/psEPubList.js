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
			if(e.detail.includes('selected')){
				shadow.querySelector('nav').style.display = (this.selected.size === 0) ? 'none':'block';
			}
		});

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
	}

	/**
	 * Draws the library page.
	 */
	async Updator(){
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
			html.querySelector('output[name="title"]').value = rec.title;

			htmlList.append(html);
		}
	}

	/**
	 * Handles a change to the observed atttibutes
	 *
	 * @param {} name
	 * @param {*} oldValue
	 * @param {*} newValue
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		if(name in this){
			this[name] = newValue;
		}
	}


	get initialCSS(){
		return [super.initialCSS,psEpubList.DefaultCSS].join('\n');
	}

	static get observedAttributes() {
		return ['pagesize', 'startat'];
	}

	static get DefaultTemplate(){
		return `
<nav>
 <button name='send' title='Encode'>🙾</button>
 <button name='save' title='Save to Disk'>🖫</button>
 <button name='delete'title='Delete'>🗑</button>
 ⏸
</nav>
<ul></ul>
	   `;

	}

	static get DefaultItem(){
		return `
<nav><input type='checkbox' /></nav>
<div><output name='id'>xxx...xxx</output></div>
<div><output name='pages-current'>365</output> of <output name='pages-total'>365</output> (<output name='pages-pct'>100</output>%)</div>
<div><label>Title</label>: <output name='title'>Life in the Woods</output></div>
<div><label>Author</label>: <output name='author'>Thoreau</output></div>
		`;
	}

	static get DefaultCSS(){
		return `

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
