'use strict';

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
		this._.shadow = this.attachShadow({mode:'open'});
		this._.shadow.innerHTML = psScanner.DefaultTemplate;
		this._.VideoStatus_Clearer = null;

		let shadow = this._.shadow;
		// for each of the buttons, add a handler
		let buttons = {
			'fromVideo': ()=>{VideoDecode('monitor');},
			'fromCamera': ()=>{VideoDecode('camera');},
			'stop': ()=>{stopCamera();},
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
	 * Handles the animation of the status button
	 *
	 * @param {string} status
	 * @returns
	 */
	VideoStatus(status){
		const allowed = ['pass','fail','warn','skip'];
		if(!allowed.includes(status)) return;

		let led = document.querySelector('.status');

		clearTimeout(VideoStatus_Clearer);
		// set the status
		window.navigator.vibrate(200);
		led.classList.add(status);
		// let it take effect
		VideoStatus_Clearer = setTimeout(() => {
			VideoStatus_Clearer = null;
			// then remove it, so that it fades away
			led.classList.remove(... allowed);
		});
	}


	/**
	 * Hides the video seelction buttons and attaches the camera to barcoder.
	 *
	 * @param {*} src
	 */
	async VideoDecode(src='monitor'){
		let panel = document.querySelector('ps-panel[name="decoder"]');
		let buttons = Array.from(panel.querySelectorAll('button'));
		let stopButton = panel.querySelector('button[name="stop"]');

		buttons.forEach(b=>{b.classList.add('hide');});
		stopButton.classList.remove('hide');
		state.pages.rotate('decoder');

		if(!state.camera){
			state.camera = new Camera();
		}
		barcoder.addEventListener('saveblock',(event)=>{
			if(event.detail.status.code === 204) return;
			VideoStatus(event.detail.status.level);
		});
		await state.camera.setMonitorSource(src);
		await barcoder.WatchVideo(state.camera);

		this.stopCamera();
	}


	/**
	 * Handles a "stop" button click
	 */
	stopCamera(){
		state.camera.StopVideo();
		let panel = document.querySelector('ps-panel[name="decoder"]');
		let buttons = Array.from(panel.querySelectorAll('button'));
		let stopButton = panel.querySelector('button[name="stop"]');
		buttons.forEach(b=>{b.classList.remove('hide');});
		stopButton.classList.add('hide');
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
		video{
			/* z-index: -100; */
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
			position: fixed;
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
