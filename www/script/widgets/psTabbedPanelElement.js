'use strict';
export {
	psTabbedPanelElement
};

import psPanelElement from './psPanelElement.js';

export default class psTabbedPanelElement extends HTMLElement {
	constructor() {
		super();

		let shadow = this.attachShadow({mode: 'open'});

		let style= document.createElement('style');
		shadow.append(style);
		style.textContent = this.initialCSS;


		let menu = document.createElement('ul');
		menu.setAttribute('part','menu');
		shadow.append(menu);

		let slot = document.createElement('slot');
		shadow.append(slot);

		this.tabs = [];
		this.panels = [];
		this.keys = {};
		let panel = localStorage.getItem('tabbedpanel');
		for(let i=0; i<this.children.length; i++){
			const d = this.children[i];
			if(!(d instanceof psPanelElement) || d.state === 'hide'){
				d.style.display = 'none';
				return;
			}
			d.normal();
			d.minimizable = false;

			let li = document.createElement('li');
			li.innerHTML = d.summary;
			menu.append(li);

			d.id = d.id || d.title;
			let key = [i.toString(), d.id].join('=');
			key = key.toLowerCase();
			this.tabs.push(li);
			this.panels.push(d);
			this.keys[key] = i;

			this.tabs[i].addEventListener('click',()=>{
				this.activate(key);
			});
			this.activate(key);

			// remove a bunch of the panel's formatting that is now controlled
			// by the tab
			d.domIcon.style.display = 'none';
			d.querySelectorAll('h1').forEach(h1=>{h1.style.display = 'none';});
			d.style.border = '0 solid black';
		}
		this.activate(panel);
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
	rotate(dir=1){
		if(typeof dir === 'string'){
			this.active = dir;
			return;
		}

		// wraps the pointer to a positive value within the array
		dir += this.pos;
		dir %= this.tabs.length;
		dir += this.tabs.length;
		dir %= this.tabs.length;

		this.pos = dir;
	}

	get pos(){
		let p = this.keys[this.active];
		return p;
	}
	set pos(index){
		index = index || 0;
		let id = this.panels[index].id;
		id = id.toLowerCase();
		let key = [index,id].join('=');
		this.active = key;
	}
	get active(){
		return this.current_key;
	}
	set active(key){
		this.activate(key);
	}

	activate(key){
		key = key || Object.keys(this.keys)[0];
		key = key.toLowerCase();
		localStorage.setItem('tabbedpanel', key);
		this.current_key = key;

		let panel = this.keys[key];
		if(!panel && panel!==0){
			key = key.replace(/[^0-9a-z]/,'=').split('=');
			key[1] = key.slice(1).join('=');
			for(let k in this.keys){
				k = k.split('=');
				if(k.includes(key[0]) || k.includes(key[1])){
					key = k.join('=');
					break;
				}
			}
			panel = this.keys[key];
			if(!panel && panel!==0){
				return;
			}
		}

		let path = new URL(document.location.href);
		path.hash = this.panels[panel].title;
		path = path.href.replace('#','/');
		path = new URL(path);
		document.title = 'MISS: ' + this.panels[panel].title;
		this.ga('set', 'page', path.pathname);
		this.ga('send', 'pageview');

		for(let p in this.panels){
			p = +p;
			if(p === panel){
				this.panels[p].classList.add('active');
				this.tabs[p].classList.add('active');
				this.panels[p].style.display = 'flex';
			}
			else{
				this.panels[p].classList.remove('active');
				this.tabs[p].classList.remove('active');
				this.panels[p].style.display = 'none';
			}
		}
	}

	get ga(){
		return window.ga || (()=>{});
	}

	get initialCSS(){
		return `
@charset 'utf-8';
* {
	/* display:none; */
}
.active{
	display:block;
}
ul {
	display:block;
	padding-left:0;
	margin-top:0;
	border-bottom:1px solid var(--main-highlight);
}
ul > li{
	display: inline-block;
	text-align: center;
	padding-left:0.5em;
	padding-right:0.5em;
	border-bottom: 0.3em solid transparent;
	/*
	height:1cm;
	*/
	width:1cm;
}
ul > li > span{
	font-size: 2em;
}
ul > li > h1{
	font-size: 50%;
}
ul > li.active{
	display: inline-block;
	border-bottom-color: orange;
	border-bottom-color: var(--main-highlight);
}
		`;
	}
}



window.customElements.define('ps-tabpanel',psTabbedPanelElement);
try{
	/* global Vue */
	if(Vue && !Vue.config.ignoredElements.includes('ps-tabpanel')){
		Vue.config.ignoredElements.push('ps-tabpanel');
	}
}
// eslint-disable-next-line
catch(err){}
