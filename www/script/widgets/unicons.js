'use strict';
export{
	unicons as default,
	unicons as icons,
	unicons
};

const iconURL= "https://fonts.googleapis.com/icon?family=Material+Icons";

document.addEventListener('load',()=>{
	let link = document.head.querySelector(`link[href="${iconURL}"]`);
	if(!link){
		link = document.createElement('link');
		link.setAttribute('rel','stylesheet');
		link.setAttribute('href',iconURL);
		document.head.append(link);
	}
})

/**
 * A collection of Unicode characters that correspond to various icons.
 *
 * All icon names correspond to those specified in Material Design icon set:
 * https://unicode-table.com/en/blocks/miscellaneous-symbols-and-pictographs/
 */
const unicons = Object.seal({
	'bar_chart'		:'&#128202;',
	'book'          :'&#128213;'	, // 📕
	'bubble_chart'	:'&#9741;',
	'bug_report'	:'&#128028;'	, // 🐜
	'collections'	:'&#128218;',
	'compare'		:'&#8783;',
	'delete'		:'&#128465;',
	'folder'		:'&#128447;',
	'folder_open'	:'&#128448;',
	'help'			:'?',
	'library_books'	:'&#128218;'	, // 📚
	'maximize'		:'&#128470;',
	'minimize'		:'&#128469;',
	'photo_camera'	:'&#128247;'	, // 📷
	'save'			:'&#128427;',
	'settings'		:'&#9881;',
	'show_chart'	:'&#128200;',
	'visibility'	:'&#128065;',
	'visibility_off':'&#128683;',
});
