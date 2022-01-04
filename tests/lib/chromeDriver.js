
import {exec} from 'child_process';
import util from 'util';
import fs from 'fs';

import webdriver  from 'selenium-webdriver';
//import chromium from 'selenium-webdriver/chromium.js';
import chrome from 'selenium-webdriver/chrome.js';
import 'chromedriver';

import Driver from './Driver.js';

const exe = util.promisify(exec);

let driver = null;

export{
	instance as default,
	instance as ChromeDriver,
};

class ChromiumDriver extends Driver{
	constructor(){
		super();
	}

	get BrowserPath(){
		return '/snap/bin/chromium';
	}

	get DriverUrl(){
		return 'https://chromedriver.storage.googleapis.com/index.html?path=96.0.4664.45/';
	}

	get ProfileDir(){
		return `${process.cwd()}/build/chrome/profile/`;
	}

	get Driver(){
		return this.getDriver();
	}

	getDriver(force=false){
		if(driver){
			if(!force) return driver;
			driver.quit();
		}

		fs.mkdirSync(this.ProfileDir,{recursive: true});
		const args = [
			'--disable-extensions',
			'--window-size=1366,768',
			'--no-sandbox', // required for Linux without GUI
			'--disable-gpu', // required for Windows,
			'--enable-logging --v=1', // write debug logs to file(debug.log)
			`--profile-directory=${this.ProfileDir}`,
			'--incognito',
		];
		let capabilities = webdriver.Capabilities.chrome();
		capabilities.set('chromeOptions', { args });
		//capabilities.set('chrome.binary', '/snap/bin/chromium');
		capabilities.set('acceptInsecureCerts', true);

		let options = new chrome.Options();
		//options.setBinaryPath('/snap/bin/chromium');

		if(Driver.useHeadless){
			//capabilities.addArguments('--headless');
			options.headless();
		}


		driver = new webdriver.Builder()
			.forBrowser('chromium')
			.setChromeOptions(options)
			.withCapabilities(capabilities)
			.build();

		return driver;
	}


	InstallDriver(){

	}

	async getDriverVersion(){
		let result = await exe('geckodriver -V');
		let text = result.stdout;
		text = text.split(' ');
		text = text[1];
		return text;
	}

	async getBrowserVersion(){
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
const instance = new ChromiumDriver();
