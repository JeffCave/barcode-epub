import vius from './util.js';


String.prototype.compare = function(a){
	return String.compare(this,a);
};

/**
 * Compares two string values character by charcter based on their Unicode values
 *
 * This differs from `localeCompare` in that it is invariant regardless of the user's settings.
 *
 * @param {string} a
 * @param {string} b
 * @returns
 */
String.compare = function(a,b){
	if(typeof a !== 'string') throw new TypeError('Invalid datatype for "a"');
	if(typeof b !== 'string') throw new TypeError('Invalid datatype for "b"');

	// one may be longer than the other, so make sure we don't go beyond the end of the shortest
	let len = Math.min(a.length,b.length);
	let diff = 0;
	for(let i=0; i<len; i++){
		// compare the Unicode values
		diff = a.codePointAt(i) - b.codePointAt(i);
		// if it is a non-zero difference, then we have found the difference, and we can stop.
		if(diff){
			break;
		}
	}
	// if they are identical for the length of the shorter, sort them by length so that the longer comes last
	if(!diff){
		diff = a.length - b.length;
	}
	// reduce it to -1, 0, or +1
	diff = Math.sign(diff);
	return diff;
};

JSON.baseStringify = JSON.stringify;
JSON.stringify = function(value,replacer,space){
	function keysort(obj){
		if(Object.isObject(obj)){
			obj = Object.entries(obj);
			obj = obj.sort((a,b)=>{
				a = a[0];
				b = b[0];
				return vius.compare(a,b);
			});
			obj = obj.reduce((a,d)=>{
				a[d[0]] = keysort(d[1]);
				return a;
			},{});
		}
		return obj;
	}
	value = keysort(value);
	value = JSON.baseStringify(value,replacer,space);
	return value;
};

if(!('isObject' in Object)){
	Object.isObject = function(o){
		let result = typeof o === 'object';
		return result;
	};
}

Object.expand = function(obj,delim='.'){
	let json = Object.create(null);
	for(let [key,value] of Object.entries(obj)){
		if(+value){
			value = +value;
		}

		key = key.split(delim).reverse();
		let pos = json;
		while(key.length > 0){
			let name = key.pop();
			name = name.trim();
			if(name === '') continue;
			let v = (key.length > 0) ? Object.create(null) : value ;
			if(name in pos){
				if(Object.isObject(pos[name]) && Object.isObject(v)){
					// the object we want to create already exists
					// there is nothing left to do
					pos = pos[name];
					continue;
				}
				if(!Array.isArray(pos[name])){
					pos[name] = [pos[name]];
				}
				pos[name].push(v);
			}
			else{
				pos[name] = v;
			}
			pos = pos[name];
		}
	}
	return json;
};

Object.flatten = function(json,delim='.'){
	if(typeof json === 'string'){
		json = JSON.parse(json);
	}
	function walk(json){
		if(Array.isArray(json)){
			let array = [];
			for(let d of json){
				d = walk(d);
				array.push(d);
			}
			return array;
		}
		else if(Object.isObject(json)){
			let obj = Object.create(null);
			for(let [name,val] of Object.entries(json)){
				if(Object.isObject(val)){
					for(let [n,v] of Object.entries(val)){
						v = walk(v);
						obj[`${name}${delim}${n}`] = v;
					}
				}
				else{
					obj[name] = val;
				}
			}
			return obj;
		}
		return json;
	}
	json = walk(json);
	return json;
};
