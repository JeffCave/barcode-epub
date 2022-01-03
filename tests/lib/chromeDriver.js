
import {exec} from 'child_process';
import util from 'util';

import webdriver  from 'selenium-webdriver';
//import chromium from 'selenium-webdriver/chromium.js';
import 'chromedriver';

import Driver from './Driver.js';

const exe = util.promisify(exec);

let driver = null;


export default class ChromiumDriver extends Driver{

	static get BrowserPath(){
		return '/snap/bin/chromium';
	}

	get DriverUrl(){
		return 'https://chromedriver.storage.googleapis.com/index.html?path=96.0.4664.45/';
	}

	static getDriver(force=false){
		if(driver){
			if(!force) return driver;
			driver.quit();
		}

		const args = [
			'--disable-extensions',
			'--window-size=1366,768',
			'--no-sandbox', // required for Linux without GUI
			'--disable-gpu', // required for Windows,
			'--enable-logging --v=1', // write debug logs to file(debug.log)
		];

		//args.push('--headless');

		let capabilities = webdriver.Capabilities.chrome()
			.set('chromeOptions', { args })
			.set('chrome.binary', '/snap/bin/chromium')
			.set('acceptInsecureCerts', true);

		driver = new webdriver.Builder()
			.forBrowser('chrome')
			.withCapabilities(capabilities)
			.build();

		return driver;
	}


	static InstallDriver(){

	}

	static async getDriverVersion(){
		let result = await exe('geckodriver -V');
		let text = result.stdout;
		text = text.split(' ');
		text = text[1];
		return text;
	}

	static async getBrowserVersion(){
		let text = null;
		try{
			text = await exec(`${ChromiumDriver.BrowserPath} --version`);
			text = text.stdout;
			text = text.split(' ');
			text = text.pop();
			text = text.replace('\n','');
		}
		catch(e){
			text = null;
		}
		return text;
	}


}