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
