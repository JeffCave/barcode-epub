'use strict';
export {
	psMobileTabPanelElement as default,
	psMobileTabPanelElement
};

import psTabbedPanelElement from './psTabbedPanelElement.js';

class psMobileTabPanelElement extends psTabbedPanelElement {
	constructor() {
		super();
		for(let p of this.panels){
			p.maximizable = false;
		}
	}

	get initialCSS(){
		let css = super.initialCSS;
		css = [css,`
		/*https://m3.material.io/components/navigation-bar/specs*/
		:host{
			flex: 1 0 auto;
			display: flex;
			flex-direction: column;
			flex-wrap: nowrap;
			align-items: stretch;
		}
		ul[part='menu']{
			flex: 0 0 auto;
			order: 0;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			margin:0;
			padding:0;
			background-color: white;
		}
		ul[part='menu'] li{
			display: inline-block;
			border:1px solid darkgray;
			flex-grow:1;
			padding-top:1em;
		}
		ul[part='menu'] li h1{
			font-size: 1em;
		}
		ul[part='menu'] li span[name='icon']{
			font-size:1.25em;
			background-color:transparent;
			border-radius:1em;
			padding: 0em 1em 0em 1em;
		}
		ul[part='menu'] li.active span[name='icon']{
			background-color:darkgray;
		}
		@media only screen and (orientation: portrait) {
			ul[part='menu']{
				order: 1;
				width:100vw;
				flex-direction: row;
			}
		}
		@media only screen and (orientation: landscape) {
			:host{
				flex-direction: row;
			}
			ul[part='menu']{
				flex: 0 0 10em;
				order: 0;
				flex-direction: column;
				border:1px solid darkgray;
			}
			ul[part='menu'] li{
				flex: 0 0 auto;
				padding-top:1em;
				border:1px solid transparent;
			}
			ul[part='menu'] li h1{
				display:inline;
				font-size: 1em;
			}
			ul[part='menu'] li span[name='icon']{
				display:inline;
				font-size:1.25em;
				padding: 1em 0em 1em 0em;
			}
		}
		`];
		css = css.join('\n');
		return css;
	}
}



try{
	window.customElements.define('ps-mobtabpanel',psMobileTabPanelElement);
	/* global Vue */
	if(Vue && !Vue.config.ignoredElements.includes('ps-mobtabpanel')){
		Vue.config.ignoredElements.push('ps-mobtabpanel');
	}
}
// eslint-disable-next-line
catch(err){}
