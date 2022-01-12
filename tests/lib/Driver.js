
export default class Driver {
	constructor(){

	}

	get useHeadless(){
		return Driver.useHeadless;
	}
}

Driver.useHeadless =
	// if this is not a debug instance
	!(typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' ')))
	// or if we are running on gitpod
	|| process.env['USER'] === 'gitpod';
