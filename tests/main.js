//https://github.com/mdn/headless-examples/blob/master/selenium-test.js

/*
global
	v8debug
*/

export{
	done,
	startServer,
	getDriver,
	getDriverGenerator,
	setupMocha,
	init,
	state,
	cleanup,
	tryUntil
};

import webdriver  from 'selenium-webdriver';

import FirefoxDriver from './lib/FirefoxDriver.js';
import ChromeDriver from './lib/chromeDriver.js';

import {fork} from 'child_process';

const state = {
	isSetup:false,
	timeout: 10000,
};


async function done(rtn = true){
	return rtn;
}

let staticServer = null;
async function startServer(){
	if(staticServer) return staticServer;

	let server = fork(`${process.cwd()}/tests/lib/server.js`,{stdio:[0,1,2,'ipc']});
	server.on('close',()=>{
		server = null;
	});
	server.on('error',(e)=>{
		console.error(JSON.stringify(e,null,4));
	});
	await new Promise((r)=>{
		server.on('message',()=>{
			clearInterval(interval);
			r();
		});
		let interval = setInterval(()=>{
			server.send('start');
		},100);
	});
	server.addr = new Promise((r)=>{
		server.on('message',(msg)=>{
			if(msg.req === 'addr'){
				r(msg.resp);
			}
		});
		server.send('addr');
	});

	function terminate(code){
		server.kill();
		process.exit(code);
	}
	process.once('exit', terminate);
	process.once('SIGINT', terminate);
	process.once('SIGTERM',terminate);

	staticServer = server;
	return server;

}


function getDriverGenerator(driver = 'chromium'){
	let generator = null;
	switch(driver){
		case 'firefox':
			generator = FirefoxDriver;
			break;
		case 'chromium':
		case 'chrome':
		default:
			generator = ChromeDriver;
			break;
	}
	return generator;
}

async function getDriver(force=false){
	if(state.driver){
		if(!force) return state.driver;
		state.driver.quit();
		state.driver = null;
	}

	let generator = getDriverGenerator();

	await generator.InstallDriver();
	state.driver = generator.getDriver();
	return state.driver;
}


function setupMocha(mocha){
	mocha.timeout(state.timeout);
}

async function init (){
	if(state.isSetup) return state;

	cleanup();
	process.env['PATH'] = [
		`${process.cwd()}/node_modules/.bin`,
		process.env['PATH']
	].join(':');

	state.server = await startServer();

	// if we are in debug mode, make some helper settings
	state.debug = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));
	if(state.debug){
		state.timeout = 1000 * 60 * 60;
	}
	else{
		state.timeout = 60000;
	}

	state.By = webdriver.By;
	state.until = webdriver.until;
	state.isSetup = true;
	return state;
}


function cleanup(){
	if(!state.isSetup) return;
	try{
		if(state.browser){
			state.browser.quit();
			state.browser.close();
			state.browser = null;
		}
		staticServer.send('stop');
		Object.keys(state).forEach(d=>{
			delete state[d];
		});
		state.isSetup = false;
	}
	catch(e){
		console.error('Failed to terminate tests');
		console.error(e);
	}
}

async function tryUntil(timeout,fun){
	if(typeof timeout === 'function'){
		fun = timeout;
		timeout = 60000;
	}

	let midpoint = timeout / 2;
	let grow = 1.62;
	let rtn = null;
	for(let delay = 23; !rtn && delay > 22;){
		try{
			rtn = await fun();
		}
		catch(e){
			rtn = null;
			delay = Math.floor(delay * grow);
			if(delay > midpoint){
				delay = midpoint;
				grow = 1/grow;
			}
			//console.log(delay);
			await new Promise((r)=>{setTimeout(r,delay);});
		}
	}
	return rtn;
}
