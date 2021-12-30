'use strict';

import Barcoder from '../bcode/Barcoder.js';
import Camera from '../bcode/Camera.js';

export {
	psScanner as default,
	psScanner
};


/**
 * A panel that offers camera related controls
 */
class psScanner extends HTMLElement {
	constructor() {
		super();
		this._ = {};
		this._.bcode = null;
		this._.shadow = this.attachShadow({mode:'open'});
		this._.shadow.innerHTML = psScanner.DefaultTemplate;
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
	 * Handles the animation of the status button
	 *
	 * @param {string} status
	 * @returns
	 */
	VideoStatus(status){
		const allowed = ['pass','fail','warn','skip'];
		if(!allowed.includes(status)) return;

		let led = this._.shadow.querySelector('.status');

		clearTimeout(this._.VideoStatus_Clearer);
		// set the status
		window.navigator.vibrate(200);
		led.classList.add(status);
		// let it take effect
		this._.VideoStatus_Clearer = setTimeout(() => {
			this._.VideoStatus_Clearer = null;
			// then remove it, so that it fades away
			led.classList.remove(... allowed);
		});
	}


	/**
	 * Hides the video selection buttons and attaches the camera to barcoder.
	 *
	 * @param {*} src
	 */
	async VideoDecode(src='monitor'){
		let panel = this._.shadow;
		let buttons = Array.from(panel.querySelectorAll('button'));
		let stopButton = panel.querySelector('button[name="stop"]');
		let video = panel.querySelector('video');


		buttons.forEach(b=>{b.classList.add('hide');});
		stopButton.classList.remove('hide');

		this.emit('start');

		if(!this._.camera){
			this._.camera = new Camera();
		}
		try{
			await this._.camera.setMonitorSource(src);
			await this.barcoder.WatchVideo(this._.camera,video);
		}
		catch(e){
			let msg = e.message.toLowerCase();
			if(msg === 'permission denied'){
				this.stopCamera();
			}
		}
	}


	/**
	 * Handles a "stop" button click
	 */
	stopCamera(){
		this._.camera.StopVideo();
		let panel = this._.shadow;

		let buttons = Array.from(panel.querySelectorAll('button'));
		let stopButton = panel.querySelector('button[name="stop"]');
		let video = panel.querySelector('video');

		buttons.forEach(b=>{b.classList.remove('hide');});
		stopButton.classList.add('hide');
		video.srcObject = null;
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
			psScanner.DefaultCSS
		].join('\n');
	}

	static get observedAttributes() {
		return [];
	}

	static get DefaultTemplate(){
		return `
<nav>
 <button name='fromVideo'>🖵</button>
 <button name='fromCamera'>📷</button>
 <button name='stop' class='hide'>⏹</button>
</nav>
<section name='video'>
 <video></video>
 <div class='status'></div>
</section>
	   `;

	}

	static get DefaultCSS(){
		return `
		button {
			min-width: 1cm;
			min-height: 1cm;
		}
		.mainaction{
			position: absolute;
			bottom: 2.5em;
			left: 2.5em;
			box-shadow: 0.25em 0.25em 0.25em darkgray;
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
		}
		:host > section > video{
			/* z-index: -100; */
			flex: 0 0 auto;
			border:0;
			background-color: slategray;
			position: relative;
			top:0;
			left:0;
			width:80vmin;
			height:80vmin;
		}

		.status{
			/*status as an LED*/
			position: absolute;
			right:0;
			bottom:0;
			display:inline-block;
			border-radius: 0.6cm;
			background-color: white;
			border:0.1cm solid black;
			height:1cm;
			width:1cm;

			/* status as a ghost frame */
			/*
			z-index:-99;
			position:fixed;
			border-radius: 0;
			background-color: rgba(0,0,0,0);
			top:0;
			left:0;
			width:100vw;
			height:100vh;
			border: 0;
			*/

			/* status colour changes*/
			--status-color:darkslategrey;
			--shadow-size: 0.8cm;
			box-shadow:-0.3cm -0.3cm var(--shadow-size) 0.1cm var(--status-color) inset;
			transition: box-shadow 2s ease-out;

		}
		.hide{
			display:none;
		}
		.pass{
			--status-color: green;
			transition: box-shadow 0s linear;
		}
		.fail{
			--status-color: red;
			transition: box-shadow 0s linear;
		}
		.warn{
			--status-color: orange;
			transition: box-shadow 0s linear;
		}
		.skip{
			--status-color: steelblue;
			transition: box-shadow 0s linear;
		}
		`;
	}

}



try{
	window.customElements.define('ps-scanner',psScanner);
}
// eslint-disable-next-line
catch(err){}
