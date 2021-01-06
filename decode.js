/**
 *
 */


const fs = require('fs');
const sha = require('js-sha512').sha512;
const { debugPort, mainModule } = require('process');

async function main(){
    let files = await fs.readdir('./encoded');
}


main();
