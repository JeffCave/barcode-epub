window.addEventListener('load',()=>{

	const monochrome = true;
	//const canvas = new OffscreenCanvas(1, 1);
	const canvas = document.querySelector('canvas').getContext('2d');
	const bwipp = BWIPP();

	async function Download(){
		const response = await fetch('./book/thoreau.LifeWoods.epub')
		let buffer = await response.arrayBuffer();
		return buffer;
	}

	async function Barcode(data){
		let cfg = {
			bcid: 'datamatrix',
			includetext: false
		};
		return new Promise((success,fail)=>{
			setTimeout(()=>{
				const bw = new BWIPJS(bwipjs_fonts, monochrome);
				bw.bitmap(new Bitmap(canvas.canvas));
				bwipp(bw, 'datamatrix', data, cfg);
				bwipjs_fonts.loadfonts(function(e) {
					if (e) {
						fail(e);
						return;
					}
					bw.render();
					let img = canvas.canvas.toDataURL();
					success(img);
				});
			},1);
		});
	}

	async function AppendBarcode(barcode){
		const main = document.querySelector('main');

		//let img = document.createElement('canvas');
		let img = document.createElement('img');

		img.setAttribute('height', barcode.height);
		img.setAttribute('width', barcode.width);

		main.append(img);

		//img.transferFromImageBitmap(barcode);
		img.src = barcode;
	}

	async function Process(stm){
		//https://www.keyence.com/ss/products/auto_id/barcode_lecture/basic_2d/datamatrix/index.jsp
		const MAXSIZE = 1550;

		let progress = document.querySelector('progress');
		progress.setAttribute('max',stm.byteLength);

		for(let offset = 0; offset < stm.byteLength; offset+=MAXSIZE){
			let len = stm.byteLength - offset;
			len = Math.min(len, MAXSIZE);

			let arr = new Uint8Array(stm,offset,len);
			arr = String.fromCharCode(...arr);
			let barcode = await Barcode(arr);
			await AppendBarcode(barcode);

			progress.value = offset;
		}
	}

	async function Convert(){
		document.querySelector('main').innerHTML = '';
		let stm = await Download();
		await Process(stm);
	}

	document.querySelector('button[name="convert"]').addEventListener('click',Convert);
});
