
export default class Driver {

}

Driver.useHeadless = !(typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' ')));
