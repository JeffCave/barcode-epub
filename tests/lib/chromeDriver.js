
import {exec} from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

import webdriver  from 'selenium-webdriver';
//import ChromiumSelenium from 'selenium-webdriver/chromium.js';
import ChromeSelenium from 'selenium-webdriver/chrome.js';
import 'chromedriver';


import ChromiumDownloader from 'download-chromium';



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
		this.BrowserPath = path.resolve(`${process.cwd()}/build/chrome/chrome`);
		this.DriverPath = path.resolve(`${process.cwd()}/node_modules/.bin/chromedriver`);
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
		capabilities.set('chrome.binary', this.BrowserPath);
		capabilities.set('acceptInsecureCerts', true);

		let options = new ChromeSelenium.Options();
		options.setBinaryPath(this.BrowserPath);

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


	async InstallDriver(){
		// look up chromium revision by taking the version number and fidning the base number
		// https://omahaproxy.appspot.com/
		// https://npm.taobao.org/mirrors/chromium-browser-snapshots/Linux_x64/
		let revision = '938248';
		let location = path.dirname(this.BrowserPath);
		this.BrowserPath = await ChromiumDownloader({
			revision: revision,
			log: true,
			onProgress: undefined,
			installPath: location
		});
		console.log(`Chromium available @ ${this.BrowserPath}`);
	}

	async getDriverVersion(){
		let result = await exe(`${this.DriverPath} --version`);
		let text = result.stdout;
		text = text.split(' ');
		text = text[1];
		return text;
	}

	async getBrowserVersion(){
		let text = null;
		try{
			text = await exe(`${this.BrowserPath} --version`);
			text = text.stdout.replace('\n',' ');
			text = text.split(' ');
			text = text[1];
		}
		catch(e){
			text = null;
		}
		return text;
	}

}
const instance = new ChromiumDriver();
