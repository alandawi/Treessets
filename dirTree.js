'use strict';

const fs = require('fs');
const PATH = require('path');

const safeReadDirSync = (path) => {
	let dirData = {};
	try {
		dirData = fs.readdirSync(path);
	} catch(ex) {
		// Don´t have permissions == ignore directory
		if (ex.code == "EACCES")
			return null;
		else throw ex;
	}
	return dirData;
}

const dirTree = (path, options, onEachFile, onEachDirectory, deep = false) => {
	const name = PATH.basename(path);
	const item = { path, name };
	let stats;

	try { stats = fs.statSync(path); }
	catch (e) { return null; }

	if (stats.isFile()) {
		const ext = PATH.extname(path).toLowerCase();

		// Skip if it does not match the extension regex
		if (options && options.extensions && !options.extensions.test(ext))
			return null;

		item.extension = ext;

		if (options && options.attributes) {
			options.attributes.forEach((attribute) => {
				item[attribute] = stats[attribute];
			});
		}

		item.isVideo = (!(/\.(gif|jpg|jpeg|tiff|png|css)$/i).test(ext));

		if (onEachFile) {
			onEachFile(item, PATH, stats);
		}
	} else if (stats.isDirectory()) {
		let dirData = safeReadDirSync(path);
		if (dirData === null) return null;

		if (deep) {
			item.timeStart = item.name.split('-')[0];
			item.timeEnd = item.name.split('-')[1];
			item.isInteractive = item.name.includes("-interactive");
		}


		if (options && options.attributes) {
			options.attributes.forEach((attribute) => {
				item[attribute] = stats[attribute];
			});
		}

		const getDirData = dirData
			.map(child => dirTree(PATH.join(path, child), options, onEachFile, onEachDirectory, true))
				.filter(e => !!e);

		// if (deep) {
		// 	item.assets = getDirData;
		// } else {
		// 	item.folders = getDirData;
		// }
		item.assets = getDirData;
		
		if (onEachDirectory) {
			onEachDirectory(item, PATH, stats);
		}
	} else {
		return null;
	}

	// Exclude some files (can improve with parameters)
	if (item.name !== '.DS_Store') {
		return item;
	}
}

module.exports = dirTree;