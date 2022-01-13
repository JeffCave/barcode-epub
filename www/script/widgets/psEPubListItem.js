'use strict';

export {
	psEpubListItem as default,
	psEpubListItem
};

import ePub from '../bcode/ePub.js';

/**
 * Items for the list of EPubs created by Barcoder
 *
 */
class psEpubListItem extends HTMLElement {
	constructor() {
		super();

		// set the default values
		this._ = {
			changes: {
				props: new Set(),
				rate: 23 /*skidoo*/,
				emitting: null
			}
		};
		this._.shadow = this.attachShadow({mode:'open'});
		this._.shadow.innerHTML = psEpubListItem.DefaultTemplate;

		let shadow = this._.shadow;

		let style= document.createElement('style');
		shadow.append(style);
		style.textContent = this.initialCSS;

		this._.changehandler = ()=>{this.Updator();};
		this.addEventListener('epub',this._.changehandler);
	}

	get epub(){
		return this._.epub;
	}
	set epub(value){
		if(this._.epub === value) return;
		if(!(value instanceof ePub)) throw new TypeError('constructor requires an ePub');

		if(this._.epub){
			this._.epub.removeEventListener('change',this._.changehandler);
		}
		value.addEventListener('change',this._.changehandler);
		this._.epub = value;
		this.emitChange('epub');
	}

	/**
	 * is the item checked
	 */
	get isSelected(){
		return this._.selected;
	}
	set isSelected(value){
		value = !!value;

		if(value === this._.selected) return;
		// apply change
		this._.selected = value;
		this.emitChange('selected');
	}

	/**
	 * Emit a change event for the given property.
	 *
	 * Change events only get emitted every 23 milliseconds to prevent
	 * overloading the system. The event sends a list of the properties
	 * that have been changed.
	 *
	 * @param {string} prop The property that has changed
	 */
	emitChange(prop){
		let changes = this._.changes;
		changes.props.add(prop);
		if(changes.emitting) return;

		changes.emitting = setTimeout(()=>{
			changes.emitting = false;
			this.emit('change',Array.from(changes.props.values()));
			changes.props.clear();
		},changes.rate);
	}


	/**
	 * Emits an event
	 *
	 * Pure helper becuase dispatching events is verbose
	 *
	 * @param {string} name
	 * @param {*} detail value to be attached to the event
	 */
	emit(name,detail){
		let event = new CustomEvent(name, {
			detail: detail
		});
		this.dispatchEvent(event);
	}


	/**
	 * Draws the item.
	 */
	async Updator(){
		let template = psEpubListItem.DefaultTemplate;

		let html = this.shadowRoot;
		html.innerHTML = template;

		let rec = this._.epub;

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
			psEpubListItem.DefaultCSS
		].join('\n');
	}

	static get observedAttributes() {
		return [];
	}

	static get DefaultTemplate(){
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
	window.customElements.define('ps-epublistitem',psEpubListItem);
	/* global Vue */
	if(Vue && !Vue.config.ignoredElements.includes('ps-epublist')){
		Vue.config.ignoredElements.push('ps-epublist');
	}
}
// eslint-disable-next-line
catch(err){}
