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
		this._.VideoStatus_Clearer = null;

		let shadow = this._.shadow;
		// for each of the buttons, add a handler
		let buttons = {
			'fromVideo': ()=>{this.VideoDecode('monitor');},
			'fromCamera': ()=>{this.VideoDecode('camera');},
			'stop': ()=>{this.stopCamera();},
		};
		for(let b in buttons){
			let button = shadow.querySelector(`button[name="${b}"]`);
			button.addEventListener('click',buttons[b]);
		}

		let style= document.createElement('style');
		shadow.append(style);
		style.textContent = this.initialCSS;

		// ensure the selection list is initialized
		this.initialize();
	}

	/**
	 * Initialize the data
	 */
	initialize(){
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

		bcoder.addEventListener('saveblock',(event)=>{
			if(event.detail.status.code === 204) return;
			this.VideoStatus(event.detail.status.level);
		});

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
 <button name='Bug' title='Report a Bug' onclick='window.location="https://gitlab.com/dpub/barcode-epub/-/issues"'>&#128028;</button>
 <button name='DeleteAll' title='Remove all data'>🔥</button>
</nav>
<section name='video'>
 <label>Field 1</label>:<input name='thing' />
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
			display: flex;
			justify-content: center;
			align-items: center;
			position:relative;
		}
		`;
	}

}



try{
	window.customElements.define('ps-options',psOptions);
}
// eslint-disable-next-line
catch(err){}
