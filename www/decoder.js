/*
https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes#38323755
*/
export {
    Decode as default
};

async function Decode(){
   const canvas = document.querySelector('canvas').getContext('2d');

   const codeReader = new ZXing.BrowserDatamatrixCodeReader();

   let imgs = Array.from(document.querySelectorAll('main > img'));
   for (let img of imgs){
       let result = await codeReader.decodeFromImage(img);
       console.log(result.text.length);
   }

}
