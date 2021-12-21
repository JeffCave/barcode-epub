'use strict';
export {
	psMobileTabPanelElement as default,
	psMobileTabPanelElement
};

import psTabbedPanelElement from './psTabbedPanelElement.js';

class psMobileTabPanelElement extends psTabbedPanelElement {
	constructor() {
		super();
	}

	get initialCSS(){
		let css = super.initialCSS;
		css = [css,`
		ul[part='menu']{
			position:fixed;
			left:0;
			bottom:0;
			width:100vw;
			display: flex;
			margin:0;
			padding:0;
		}
		ul[part='menu'] li{
			display: inline-block;
			border:1px solid darkgray;
			flex-grow:1;
		}
		ul[part='menu'] li.active span[name='icon']{
			background-color:darkgray;
			border-radius:1em;
			padding-left:1em;
			padding-right:1em;
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
