'use strict';

class psProgress extends HTMLProgressElement{
	constructor() {
		super();

		this.diffBuff = [0,0,0,0,0,0,0,0,0,0];
		setInterval(()=>{
			let diff = +this.diffBuff.pop();
			diff = diff && !Number.isNaN(diff) ? diff : 0;
			if(diff > super.value){
				diff = super.value;
			}
			if(super.value !== super.max){
				super.value -= diff;
				super.max -= diff;
			}
			if(super.value >= this.max){
				super.value = 1;
				super.max = 1;
			}
			this.diffBuff.unshift(0);
		},1000*30);
	}

	get max(){
		return super.max;
	}

	set max(value){
		value = +value;
		value = value && !Number.isNaN(value) ? value : 0;
		if(Number.isNaN(value)){
			value = super.max;
		}
		if(super.max === super.value){
			super.value = 0;
			value --;
		}
		super.max = value;
		if(super.max <= this.value){
			super.max = 1;
			super.value = 1;
			this.diffBuff.fill(0);
		}
		super.max = value;
	}

	get value(){
		return super.value;
	}

	set value(value){
		value = +value;
		value = value && !Number.isNaN(value) ? value : 0;
		this.diffBuff[0] += value - super.value;
		super.value = value;
		if(super.value >= this.max){
			super.value = 1;
			super.max = 1;
			this.diffBuff.fill(0);
		}
		super.value = value;
	}

	get title(){
		let pct = (this.position*100).toFixed(1);
		let msg = "Nothing happening right now.";
		if(this.ratio !== 1){
			msg = this.value + ' of ' + this.max + ' ('+pct+'%)';
		}
		return msg;
	}
}

customElements.define('ps-progress', psProgress, {extends:'progress'});

