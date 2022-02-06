export {
	ScaleDate as default,
	ScaleDate,
};


const privates = new WeakMap();

/**
 * A sliding scale date that fits into two bytes.
 *
 * As the date gets further from epoch, the value becomes less acurate.
 *
 * The value is stored in a 16-bit signed integer. Epoch is assumed to
 * be `0`, which is equivalent of `new Date(0)` or `1970-01-01`
 *
 * bit 1: signifies positive or negative
 *
 * if the second bit is 0, the rest of the bits consitute an integer
 * representing the number of days since epoch.
 *
 * if the second bit is 1, the next bit tells us if it is counting by
 * months (0), or years (1). Either way, the rest of the integer represents
 * the number of units that have passed.
 *
 * The values are cumulative, so if we have moved past days, into months,
 * the date that the maximum possible number of days evaluated to is added
 * to the months signified.
 *
 * # Examples
 *
 * ## 1970-01-01
 *
 * ```
 * days
 *  |
 * 0000 0000 0000 0000
 * | \_______________/
 * |           \
 * positive     1
 * ```
 *
 * ## 1969-12-20
 *
 * ```
 * days
 *  |
 * 1000 0000 0000 1100
 * | \_______________/
 * |           \
 * negative     12
 * ```
 * This evaluates to `-12` days. `1970-01-01 - 12 days`
 *
 * ## 2014-10-08
 *
 * ```
 * days
 *  |
 * 0011 1111 1111 1111
 * | \_______________/
 * |           \
 * positive     16383
 * ```
 * `1970-01-01` + `16383 days`
 * `2014-10-08Z`
 *
 * ## 2015-09-01
 *
 * ```
 * months
 *  /\
 * 0100 0000 0000 1011
 * |  \_______________/
 * |           \
 * positive     11
 * ```
 * `2014-10-08Z` + `11 months`
 * `2015-09-01`
 *
 * ## 10888-01-01
 *
 * ```
 * years
 *  /\
 * 0111 1111 1111 1111
 * |  \______________/
 * |           \
 * positive     8191
 * ```
 * `1970-01-01` <-- epoch
 * `1970-01-01` + `16383 days` => `2014-10-08`
 * months => `2014-10-01`
 * `2014-10-01` + `8191 months` => `2697-05-01`
 * years => `2697-01-01`
 * `2697-01-01` + `8191 years` => `+010888-01-01`
 *
 * ## Significant Dates
 *
 * ```
 * 1066-01-01: 1110 0000 1011 0000
 * 2020-03-01: ???
 * ```
 */
class ScaleDate{
	constructor(init=0,epoch = 0){
		privates.set(this,{});
		this.value = init;
		this.epoch = epoch;
	}

	/**
	 * The underlying 16-bit value
	 */
	get value(){
		return privates.get(this).raw;
	}
	set value(value){
		value = value & 0xFFFF;
		privates.get(this).raw = value;
	}

	/**
	 * The offset for the date
	 */
	get epoch(){
		return privates.get(this).epoch;
	}
	set epoch(value){
		if(!(value instanceof ScaleDate)){
			value = new ScaleDate(value,0);
		}
		privates.get(this).epoch = value;
	}

	/**
	 * Determines if it is moving forward or backward from teh epoch
	 */
	get isPositive(){
		let pos = this.value | 0x8000;
		return !!pos;
	}

	/**
	 * Returns a positive or negative 1 as appropriate
	 */
	get sign(){
		let sign = this.isPositive ? 1 : -1;
		return sign;
	}

	/**
	 * Checks if underlying value is using Days
	 */
	get isUsingDays(){
		let d = this.value;
		d = d | this.DaysMarker;
		d = !d;
		return d;
	}
	/**
	 * Checks if the underlying value is using Months
	 */
	get isUsingMonths(){
		let d = this.value;
		d = d | this.MonthsMarker;
		d = !d;
		d = d && this.isUsingDays;
		return d;
	}
	/**
	 * Checks if the underlying value is using Years
	 */
	get isUsingYears(){
		let d = !this.isUsingDays && !this.isUsingMonths;
		return d;
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
		let days = 0;
		let months = 0;
		let years = 0;
		if(this.isUsingDays){
			days = this.value % this.DaysMarker;
			days *= this.sign;
			date.setUTCDate(days);
		}
		else{
			days = this.MaxDays;
			days *= this.sign;
			date.setUTCDate(days);
			date.setUTCDate(1);
			if(this.isUsingMonths){
				months = this.value % this.MonthsMarker;
				months *= this.sign;
				months += date.getUTCMonth()-1;
				date.setUTCMonth(months);
			}
			else{
				months = this.MaxMonths;
				months *= this.sign;
				months += date.getUTCMonth()-1;
				date.setUTCMonth(months);
				date.setUTCMonth(0);

				years = this.value % this.YearsMarker;
				years *= this.sign;
				years += date.getUTCFullYear();
				date.setUTCFullYear(years);
			}
		}

		p.date = date;
		return date;
	}

	toString(){
		let date = this.toDate();
		date = date.toISOString();
		date = date.split('T');
		date = date.shift();
		return date;
	}

	/*** CONSTANTS *********************************/

	/**
	 * Maximum number of days that can be counted
 	 */
	static get MaxDays(){
		return ScaleDate.DaysMarker - 1;
	}
	/**
	 * Maximum number of days that can be counted
	 */
	get MaxDays(){
		return ScaleDate.MaxDays;
	}
	/**
	 * Bit that marks the use of days
	 */
	static get DaysMarker(){
		return 0x4000;
	}
	/**
	 * Bit that marks the use of days
	 */
	get DaysMarker(){
		return ScaleDate.DaysMarker;
	}
	/**
	 * Maximum possible count of Months
	 */
	static get MaxMonths(){
		return ScaleDate.MonthsMarker-1;
	}
	/**
	 * Maximum possible count of Months
	 */
	get MaxMonths(){
		return ScaleDate.MaxMonths;
	}
	/**
	 * Bit which signifies that Months are being used
	 */
	static get MonthsMarker(){
		return 0x2000;
	}
	/**
	 * Bit which signifies that Months are being used
	 */
	get MonthsMarker(){
		return ScaleDate.MonthsMarker;
	}
	/**
	 * Maximum possible count of Months
	 */
	static get MaxYears(){
		return ScaleDate.YearsMarker-1;
	}
	/**
	 * Maximum possible count of Months
	 */
	get MaxYears(){
		return ScaleDate.MaxYears;
	}
	static get YearsMarker(){
		return 0x2000;
	}
	get YearsMarker(){
		return ScaleDate.YearsMarker;
	}

	static get DefaultEpoch(){
		return new ScaleDate(0,0);
	}

}
