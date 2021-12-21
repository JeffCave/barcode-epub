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
		ul[part='menu']{
			position:fixed;
			left:0;
			bottom:0;
			display: flex;
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
		}
		ul[part='menu'] li.active span[name='icon']{
			background-color:darkgray;
			border-radius:1em;
			padding-left:1em;
			padding-right:1em;
		}
		@media only screen and (orientation: portrait) {
			ul[part='menu']{
				width:100vw;
				flex-direction: row;
			}
		}
		@media only screen and (orientation: landscape) {
			ul[part='menu']{
				height:100vh;
				flex-direction: column;
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
