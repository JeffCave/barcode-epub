export {
	ScaleDate as default,
	ScaleDate,
};


const privates = new WeakMap();

/**
 * A sliding scale date that fits into two bytes.
 *
 * As the date gets further from epoch, the value becomes less acurate.
 */
class ScaleDate{
	constructor(init=0,epoch = 0){
		privates.set(this,{});
		this.value = init;
		this.epoch = epoch;
	}

	get values(){
		return privates.get(this).raw;
	}
	set value(value){
		value = value & 0xFFFF;
		privates.get(this).raw = value;
	}

	get epoch(){
		return privates.get(this).epoch;
	}
	set epoch(value){
		if(!(value instanceof ScaleDate)){
			value = new ScaleDate(value,0);
		}
		privates.get(this).epoch = value;
	}

	get isPositive(){
		let pos = this.value | 0x8000;
		return !!pos;
	}

	static get MaxDays(){
		return ScaleDate.DaysMarker - 1;
	}
	get MaxDays(){
		return ScaleDate.MaxDays;
	}
	static get DaysMarker(){
		return 0x4000;
	}
	get DaysMarker(){
		return ScaleDate.DaysMarker;
	}

	get isDays(){
		return !!(this.value | this.DaysMarker);
	}

	static get MaxMonths(){
		return ScaleDate.MonthsMarker-1;
	}
	get MaxMonths(){
		return ScaleDate.MaxMonths;
	}
	static get MonthsMarker(){
		return 0x2000;
	}
	get MonthsMarker(){
		return ScaleDate.MonthsMarker;
	}
	get isMonths(){
		return this.value | this.MonthsMarker;
	}

	static get YearsMarker(){
		return 0x2000;
	}
	get YearsMarker(){
		return ScaleDate.YearsMarker;
	}
	get isYears(){
		return !!(this.value | this.YearsMarker);
	}

	get year(){
		return this.toDate().getUTCFullYear();
	}

	get month(){
		return this.toDate().getUTCMonth()+1;
	}

	get day(){
		return this.toDate().getUTCDate();
	}

	toDate(){
		let p = privates.get(this);
		if('date' in p) return p.date;

		let date = new Date(0);
		if(this.isDays){
			let days = this.value % this.DaysMarker;
			date.setUTCDate(days);
		}
		else if(this.isMonths){
			let months = this.value % this.MonthsMarker;
			date.setUTCDate(this.MaxDays);
			date.setUTCDate(1);

			months += date.getUTCMonth();
			date.setUTCMonth(months);
		}
		else if(this.isYears){
			let years = this.value % this.YearsMarker;
			date.setUTCDate(this.MaxDays);
			date.setUTCDate(1);
			date.setUTCMonth(this.MaxMonths);
			date.setUTCMonth(0);

			years += date.getUTCFullYear();
			date.setUTCFullYear(years);
		}

		p.date = date;
		return date;
	}

	toString(){
		let date = this.toDate();
		date = date.toISOString();
		date = date.substr(0,10);
		return date;
	}

	static get epoch(){
		return new ScaleDate(0,0);
	}

}
