'use strict';

import Barcoder from '../bcode/Barcoder.js';

export {
	psOptions as default,
	psOptions
};


/**
 * A panel that offers camera related controls
 */
class psOptions extends HTMLElement {
	constructor() {
		super();
		this._ = {};
		this._.bcode = null;
		this._.shadow = this.attachShadow({mode:'open'});
		this._.shadow.innerHTML = psOptions.DefaultTemplate;


		// ensure the selection list is initialized
		this.initialize();
	}

	/**
	 * Initialize the data
	 */
	initialize(){
		let shadow = this._.shadow;
		// for each of the buttons, add a handler
		let buttons = {
			'Bug': ()=>{ window.open('https://gitlab.com/dpub/barcode-epub/-/issues','_blank'); },
			'DeleteAll': async ()=>{
				let token = await this.barcoder.RemoveAll();
				if(confirm('Are you sure you want to burn your data?')){
					this.barcoder.RemoveAll(token);
				}
			},
		};
		for(let b in buttons){
			let button = shadow.querySelector(`button[name="${b}"]`);
			button.addEventListener('click',buttons[b]);
		}

		let style= document.createElement('style');
		shadow.append(style);
		style.textContent = this.initialCSS;

		this._.isloaded = true;
		this.emit('loaded');
	}

	get isLoaded(){
		return this._.isloaded;
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

		this._.bcoder = bcoder;
		this.emitChange('barcoder');
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
		let changes = this._.changes = this._.changes || {
			props: new Set(),
			rate: 23 /*skidoo*/,
			emitting: null
		};
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
			psOptions.DefaultCSS
		].join('\n');
	}

	static get observedAttributes() {
		return [];
	}

	static get DefaultTemplate(){
		return `
<nav>
 <button name='Bug' title='Report a Bug'>&#128028;</button>
 <button name='DeleteAll' title='Remove all data'>🔥</button>
</nav>
<section>
 <label>Theme</label>
  Light<input type='range' name='theme' min='0' max='1' step='1' value='0' />Dark
 <label>Backup</label>
  <input type='button' name='BackupFull' value='Complete' />
  <input type='button' name='BackupConfig' value='Config' />
  <input type='button' name='BackupBooks' value='Books' />
 <h2>Filters</h2>
 <label>Subjects</label>
 <input type='text' name='filter.subject' placeholder='Regex expression. Matches will be removed.' />
 <label>Author</label>
 <input type='text' name='filter.author' placeholder='Regex expression. Matches will be removed' />
 <label>Title</label>
 <input type='text' name='filter.title' placeholder='Regex expression. Matches will be removed' />
 <details open>
  <summary><label>Programatic Filter</label></summary>
  <details style='margin-left:2em;'>
   <summary style='font-size:smaller'><span style='display:inline-block;position:relative;padding:0.5em;border:1px solid black;border-radius:1em;'>ℹ</span></summary>
   <p>
   The function filter will wrap the contents in a function which will
   pass a <code>doc</code> object. Assuming a <code>true</code> value is
   returned it will retain the contents of the record.
   </p>
  </details>
  <textarea name='filter.function' placeholder='let title = doc.meta.title;\nlet keep = title.contains("Alice");\nreturn keep;'></textarea>
 </details>
</section>
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
			min-width: 48px;
			min-height: 48px;
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
		:host > section {
			flex: 1 0 auto;
			display: block;
			justify-content: center;
			align-items: center;
			position:relative;
			padding: 1em;
		}
		label{
			display:block;
			font-size: 1em;
			font-weight: bold;
		}
		input{
			height: 2em;
		}
		input:hover{
			box-shadow: 0 0 0.2em 0.1em darkgray;
		}

		summary > * {
			display:inline-block;
		}

		code{
			background-color:lightgray;
			padding:0.2em;
			border-radius:0.2em;
			border: 1px solid black;
		}


		/** Toggle **/
		input[type=range] {
			height: 32px;
			-webkit-appearance: none;
			margin: 10px 0;
			width: 64px;
		}
		input[type=range]:focus {
			outline: none;
		}
		input[type=range]::-webkit-slider-runnable-track {
			height: 30px;
			cursor: pointer;
			animate: 0.2s;
			box-shadow: 1px 1px 1px #000000;
			background: #3071A9;
			border-radius: 32px;
			border: 1px solid #000000;
		}
		input[type=range]::-webkit-slider-thumb {
			box-shadow: 1px 1px 1px #000000;
			border: 1px solid #000000;
			height: 24px;
			width: 25px;
			border-radius: 11px;
			background: #FFFFFF;
			cursor: pointer;
			-webkit-appearance: none;
			margin-top: 2px;
		 }
		input[type=range]:focus::-webkit-slider-runnable-track {
			background: #3071A9;
		}
		input[type=range]::-moz-range-track {
			width: 128px;
			height: 30px;
			cursor: pointer;
			animate: 0.2s;
			box-shadow: 1px 1px 1px #000000;
			background: #3071A9;
			border-radius: 25px;
			border: 1px solid #000000;
		}
		input[type=range]::-moz-range-thumb {
			box-shadow: 1px 1px 1px #000000;
			border: 1px solid #000000;
			height: 24px;
			width: 25px;
			border-radius: 11px;
			background: #FFFFFF;
			cursor: pointer;
		}
		input[type=range]::-ms-track {
			width: 128px;
			height: 30px;
			cursor: pointer;
			animate: 0.2s;
			background: transparent;
			border-color: transparent;
			color: transparent;
		}
		input[type=range]::-ms-fill-lower {
			background: #3071A9;
			border: 1px solid #000000;
			border-radius: 50px;
			box-shadow: 1px 1px 1px #000000;
		}
		input[type=range]::-ms-fill-upper {
			background: #3071A9;
			border: 1px solid #000000;
			border-radius: 50px;
			box-shadow: 1px 1px 1px #000000;
		}
		input[type=range]::-ms-thumb {
			margin-top: 1px;
			box-shadow: 1px 1px 1px #000000;
			border: 1px solid #000000;
			height: 24px;
			width: 25px;
			border-radius: 11px;
			background: #FFFFFF;
			cursor: pointer;
		}
		input[type=range]:focus::-ms-fill-lower {
			background: #3071A9;
		}
		input[type=range]:focus::-ms-fill-upper {
			background: #3071A9;
		}
		input[type='range'][value='0']::-webkit-slider-runnable-track {
			background: lightblue;
		}
		`;
	}

}



try{
	window.customElements.define('ps-options',psOptions);
}
// eslint-disable-next-line
catch(err){}
