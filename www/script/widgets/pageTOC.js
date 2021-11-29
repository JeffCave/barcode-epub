'use strict';

(function(){



	function CreateToc(src){
		let main = document.querySelector(src);
		if(main === null) return '';

		let headers = Array.from(main.querySelectorAll('h1,h2,h3,h4,h5,h6'));

		let toc = headers
			.map(function(d){
				let id = d.getAttribute('id');
				if(!id){
					id = d.innerText
						.replace(/ /g, '')
						.toLowerCase()
					;
					d.setAttribute('id',id);
				}
				let depth = parseInt(d.nodeName.replace('H',''),10);
				return {
					id:id,
					depth: depth,
					text:d.innerText,
					node:d,
					children:[],
				};
			})
		;
		//toc.unshift({depth:0,children:[]});
		toc[0].depth = 0;
		toc.forEach((d,i,a)=>{
			if(d.depth===0) return;

			for(let j=i-1;j>=0;j--){
				if(d.depth > a[j].depth){
					a[j].children.push(d);
					break;
				}
			}
		});

		function ListToHTML(list){
			let html = list.map((d)=>{
				let children = ListToHTML(d.children);
				let html = "<li><a href='#{id}'>{label}</a>{children}</li>"
					.replace(/{id}/g, d.id)
					.replace(/{label}/g, d.text)
					.replace(/{depth}/g, d.depth)
					.replace(/{children}/g, children)
					;
				return html;
			});
			if(html.length > 0){
				html.unshift('<ol>');
				html.push('</ol>');
			}
			html = html.join('');
			return html;
		}
		toc = ListToHTML(toc[0].children);
		return toc;
	}



	window.addEventListener('load',()=>{
		let tocs = Array.from(document.querySelectorAll('nav[data-type="toc"]'));
		tocs = tocs.reduce((a,d)=>{
			let src = a[d.dataset.src];
			if(!Array.isArray(src)){
				src = [];
				a[d.dataset.src] = src;
			}
			src.push(d);
			return a;
		},{});
		Object.entries(tocs).forEach(toc=>{
			let html = CreateToc(toc[0]);
			toc[1].forEach(toc=>{
				let h1 = toc.querySelector('h1');
				toc.innerHTML = h1 ? h1.outerHTML : '<h1>Table of Contents</h1>';
				toc.innerHTML += html;
			});
		});
	});


})();
