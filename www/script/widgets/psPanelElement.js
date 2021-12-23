'use strict';

export {
	psPanelElement
};

import icons from './unicons.js';

export default class psPanelElement extends HTMLElement {
	constructor() {
		super();

		this._ = {};

		this.classList.add('hide');
		this.classList.add('maximize');
		this.classList.add('minimize');
		this.classList.add('normal');

		let panel = this.attachShadow({mode: 'open'});

		let style= document.createElement('style');
		panel.append(style);
		style.textContent = this.initialCSS;

		this.domIcon = document.createElement('span');
		panel.append(this.domIcon);
		this.domIcon.setAttribute('name','icon');
		this.domIcon.style.cursor = 'default';
		this.domIcon.innerHTML =
			icons[this.icon] ||
			this.icon.split().shift() ||
			'&nbsp;'
		;

		this.domResizer = document.createElement('span');
		this.domResizer.setAttribute('part','resizer');
		panel.append(this.domResizer);

		this.domMaximize = document.createElement('span');
		// toggle the switch on/off to reset everything
		this.maximizable = !this.maximizable;
		this.maximizable = !this.maximizable;
		this.domResizer.append(this.domMaximize);
		let btn = this.domMaximize;
		btn.classList.add('resizer');
		btn.setAttribute('name','maximize');
		btn.innerHTML = '&#128470;';
		btn.addEventListener('click',(e)=>{
			this.state = 'maximize';
			e.stopPropagation();
		});

		this.domRestore = document.createElement('span');
		this.domResizer.append(this.domRestore);
		btn = this.domRestore;
		btn.setAttribute('name','normal');
		btn.innerHTML = '&#128471;';
		btn.addEventListener('click',(e)=>{
			this.state = 'normal';
			e.stopPropagation();
		});

		this.domMinimize = document.createElement('span');
		// toggle the switch on/off to reset everything
		this.minimizable = !this.minimizable;
		this.minimizable = !this.minimizable;
		this.domResizer.append(this.domMinimize);
		btn = this.domMinimize;
		btn.setAttribute('name','minimize');
		btn.innerHTML = '&#128469;';
		btn.addEventListener('click',(e)=>{
			this.state = 'minimize';
			e.stopPropagation();
		});

		let slot = document.createElement('slot');
		panel.append(slot);

		this.state =  this.getAttribute('state');
		this[this.state]();
	}

	get icon(){
		let i = this.getAttribute('icon');
		return i || '';
	}

	set icon(value){
		this.setAttribute('icon', value);
	}

	get summary(){
		let summary = this.domIcon.outerHTML;
		let h1 = this.querySelector('h1');
		if(h1){
			summary += h1.outerHTML;
		}
		return summary;
	}

	get title(){
		if (this._.title) return this._.title;

		this._.title = ' ';
		let title = this.querySelector('h1');
		if(title){
			this._.title = title.textContent;
		}
		return this._.title;
	}

	minimize(){
		this.addEventListener('click',psPanelElement.restorePanel);
		//this.domIcon.addEventListener('click',psPanelElement.restorePanel);
		this.classList.add('minimize');
	}

	normal(){
		this.removeEventListener('click',psPanelElement.restorePanel);
		//this.domIcon.removeEventListener('click',psPanelElement.restorePanel);
		this.classList.add('normal');
	}

	hide(){
		this.minimize();
		setTimeout(()=>{
			this.classList.add('hide');
		},1000);
	}

	maximize(){
		this.normal();
		this.classList.remove('normal');
		this.classList.add('maximize');
	}

	setState(value){
		this.state = value;
	}

	get state(){
		return this.getAttribute('state') || 'normal';
	}

	set state(value){
		const allowed = ['normal','maximize','minimize','hide'];
		let orig = this.state;

		// TODO: This annoys me and breaks transition animations.
		// Fix this to not need to remove classes, only add them. This will
		// allow for the transitions to always be applied.
		//
		// This removal is a hacky way to force this one to be most recent
		this.classList.remove(...allowed);

		value = (value || '');
		value = value.toLowerCase();
		if(!allowed.includes(value)){
			value = 'normal';
		}

		this.setAttribute('state',value);
		if(value !== orig){
			this[this.state]();
		}
	}

	get minimizable(){
		let value = this.getAttribute('minimize');
		value = value || 'true';
		value = value.toLowerCase();
		value = ('true' === value);
		return value;
	}
	set minimizable(value){
		value = (value == true);
		let oldval = this.minimizable;
		if(value === oldval){
			return;
		}

		this.setAttribute('minimize',value);
		this.domMinimize.style.display = value ? '' : 'none';
	}

	get maximizable(){
		let value = this.getAttribute('can-maximize');
		value = value || 'true';
		value = value.toLowerCase();
		value = ('true' === value);
		return value;
	}
	set maximizable(value){
		value = (value == true);
		let oldval = this.maximizable;
		if(value === oldval){
			return;
		}

		this.setAttribute('can-maximize',value);
		this.domMaximize.style.display = value ? '' : 'none';
	}

	static restorePanel(e){
		e.target.state = 'normal';
	}

	get initialCSS(){
		return `
@charset 'utf-8';
:host{
	flex: 1 0 auto;
	display:block;
	position:relative;
	color:inherit;
	background-color:transparent;
	border:0.1em solid;
	border-radius:0.3em;
}

[part='resizer']{
	float: right;
	z-index: 100000;
	cursor: default;
	text-shadow: 0 0 1px white;
}

:host(.normal){
	flex: 1 0 auto;
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	align-items: stretch;
	position: relative;
	min-width:inherit;
	max-width:inherit;
	min-height:inherit;
	max-height:inherit;
	overflow:inherit;
	transition:
		min-width 1s,
		max-width 1s,
		min-height 1s,
		max-height 1s,
		height 1s,
		width 1s,
		opacity 1s,
		visibility 0.9s
		;
	transition-timing-function: cubic-bezier;
}
:host(.maximize) {
	position:fixed !important;
	z-index:100;
	top:0;
	bottom:0;
	right:0;
	left:0;
	background-color:var(--main-color-contrast);
	transition:
		min-width 1s,
		max-width 1s,
		min-height 1s,
		max-height 1s,
		height 1s,
		width 1s,
		opacity 1s,
		visibility 0.9s
		;
	transition-timing-function: cubic-bezier;
}
:host(.minimize){
/*
	--total-border:calc(var(border-width)*2 - var(margin-left) - var(margin-right) - var(padding-left) - var(padding-right));
	min-width:calc(1cm - var(--total-border));
*/
	min-width:1cm;
	max-width:1cm;
	min-height:1cm;
	max-height:1cm;
	overflow:hidden;
	transition:
		min-width 1s,
		max-width 1s,
		min-height 1s,
		max-height 1s,
		height 1s,
		width 1s,
		opacity 1s,
		visibility 0.9s
		;
	transition-timing-function: cubic-bezier;
	display:flex;
	align-items: center;
	justify-content: center;
}
:host(.hide){
	display:none;
	transition:
		min-width 1s,
		max-width 1s,
		min-height 1s,
		max-height 1s,
		height 1s,
		width 1s,
		opacity 1s,
		visibility 0.9s
		;
	transition-timing-function: cubic-bezier;
}







:host(.normal) > * {
	transition: opacity 1s,visibility 1s;
}
:host(.normal) > span[part='resizer'] > span[name='normal']{
	display:none;
}
:host(.normal) [part='resizer'] > span[name='maximize']{
	display:inline;
}
:host(.normal) [part='resizer'] > span[name='minimize']{
	display:inline;
}

:host(.minimize) [part='resizer'] > *, :host(.minimize) > ::slotted(*) {
	visibility: hidden;
	opacity: 0;
	transition: opacity 0.5s, visibility 0.9s;
}


:host(.maximize) [part='resizer'] > span[name='maximize']{
	display:none;
}
:host(.maximize) [part='resizer'] > span[name='normal']{
	display:inline;
}


:host(.minimize) [part='resizer'] > span[name='icon'] {
	opacity:1;
	position:absolute;
	visibility:visible;
	transition: opacity 1s,visibility 1s;
	font-size: 0.75cm;
}

		`;
	}

}



try{
	window.customElements.define('ps-panel',psPanelElement);
	/* global Vue */
	if(Vue && !Vue.config.ignoredElements.includes('ps-panel')){
		Vue.config.ignoredElements.push('ps-panel');
	}
}
// eslint-disable-next-line
catch(err){}
