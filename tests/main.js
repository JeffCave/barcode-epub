//https://github.com/mdn/headless-examples/blob/master/selenium-test.js

/*
global
	v8debug
*/

export{
	getGeckoVersion,
	getFirefoxVersion,
	done,
	startServer,
	getDriver,
	setupMocha,
	init,
	state,
	cleanup
};

import webdriver  from 'selenium-webdriver';

import FirefoxDriver from './lib/FirefoxDriver.js';
import ChromeDriver from './lib/chromeDriver.js';

import fs from 'fs';
import {exec,fork} from 'child_process';

const state = {isSetup:false};

const ffPath = './build/firefox/firefox';


console.log('I am the very model of a modern major general');


/**
 * @deprecated use 'FirefoxDriver.getDriverVersion' instead
 */
async function getGeckoVersion(){
	return FirefoxDriver.getDriverVersion();
}

/**
 * @deprecated use 'FirefoxDriver.getBrowserVersion' instead
 */
async function getFirefoxVersion(){
	return FirefoxDriver.getBrowserVersion();
}

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


function getDriver(force=false){
	if(state.driver){
		if(!force) return state.driver;
		state.driver.quit();
		state.driver = null;
	}

	//let generator = FirefoxDriver;
	let generator = ChromeDriver;

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

	if(!fs.existsSync(ffPath)){
		await exec('get-firefox --target "./build/" --extract ');
	}

	// if we are in debug mode, make some helper settings
	state.debug = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));
	if(state.debug){
		state.timeout = 1000 * 60 * 60;
	}
	else{
		state.timeout = 10000;
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
