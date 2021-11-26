'use strict';


export default class vius{
	/**
	 * Read the settings from the form and convert them into a data
	 * object.
	 *
	 * Return: collection of key value pairs
	 */
	static readOptions(node){
		if(typeof node === 'string'){
			node = document.querySelector(node);
		}
		let form = node.querySelectorAll('input');
		form = Array.from(form);
		let opt = {};
		for(let f in form){
			let field = form[f];
			let name = field.getAttribute('name');
			let value = field.value;
			//opt[name] = parseInt(value,10);
			opt[name] = value;
		}

		return opt;

	}

	/**
	 * Disable all of my options
	 */
	static enableOptions(enabled = true){
		if(enabled !== true && enabled !== false){
			console.warn('Nonsense value passed to enableOptions');
			return;
		}
		let form = document.querySelectorAll('#opts input');
		let disabled = !enabled;
		Array.from(form).forEach(function(field){
			field.disabled = disabled;
		});
	}

	static async hash(str, hash = 'SHA-1'){
		str = new TextEncoder('utf-8').encode(str);
		str = await window.crypto.subtle.digest(hash,str);
		str = Array.from(new Uint8Array(str)).map(d=>{
			return String.fromCharCode(d);
		}).join('');
		str = 'node.'+window.btoa(str);
		return str;
	}

	static schedule(delay, fun) {
		if(delay < 1) delay = 1;
		return new Promise((resolve) =>{
			setTimeout(async ()=>{
				let result = await fun();
				resolve(result);
			}, delay);
		});
	}

	static throttle(delay, func) {
		let next = 0;
		let scheduled = null;
		return function(){
			if(scheduled) return;

			let now = Date.now();
			if(now > next){
				next = now;
			}
			next = next - now;
			scheduled = vius
				.schedule(next,func)
				.finally(()=>{
					scheduled = null;
				})
			;
			next = now + delay;
		};
	}
}
