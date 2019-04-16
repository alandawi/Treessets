const EventEmitter = require('events').EventEmitter;
const dirTree = require("./dirTree");
const util = require('util');
const fs = require('fs');
const templater = require('spritesheet-templates');
const Spritesmith = require('spritesmith');
const eventBus = new EventEmitter();

const constants = {
	ASSETS_FOLDER: 'assets',
	OUTPUT_FOLDER: 'output',
	THUMB_PREFIX: '_thumb_',
}

let foldersInAssets = [];
let output = {
    data: {}
};

// Read all files from current directory
fs.readdir(`./${constants.ASSETS_FOLDER}/`, (err, folders) => {
    if(err) throw err;

    folders.forEach(folder => {
        if (folder !== '.DS_Store') {
            foldersInAssets.push(folder);
        }
    });
    
    eventBus.emit('files_ready');
});

eventBus.on('files_ready', () => {
    foldersInAssets.forEach(folder => {
        output.data[folder] = {};

        // Get information
        const tree = dirTree(
            `./${constants.ASSETS_FOLDER}/${folder}`,
            null,
            file => {
                // console.log("FILE:", file);
            },
            folder => {
                const thumbsImages = folder.assets.filter((file) => {
                    return file.name.includes(constants.THUMB_PREFIX);
                }).map((file) => file.path);

                // Generate our spritesheet
                Spritesmith.run({
                    src: thumbsImages,
                    algorithm: 'binary-tree' // https://www.npmjs.com/package/spritesmith
                }, (err, result) => {
                    if (err) {
                        console.log("ERROR", err);
                        throw err;
                    }
                    
                    const outputSpriteImage = __dirname + `/${constants.ASSETS_FOLDER}/${folder.name}/${folder.name}.png`;
                    const outputSpriteCSS = __dirname + `/${constants.ASSETS_FOLDER}/${folder.name}/${folder.name}.css`;
                
                    // Output the final image - TODO: Need to locate in the same dir
                    fs.writeFileSync(outputSpriteImage, result.image);

                    var myObject = result.coordinates;

                    const cleanedSprites = Object.keys(myObject).map(key => {
                        myObject[key].name = key.split('/').pop();
                        return myObject[key];
                    });

                    // Generate the images
                    const spriteData = templater({
                        sprites: cleanedSprites,
                        spritesheet: {
                            width: result.properties.width,
                            height: result.properties.height,
                            image: outputSpriteImage
                        }
                    }, {
                        format: 'css',
                        spritesheetName: folder.name
                    });

                    // Create the css file
                    fs.writeFileSync(outputSpriteCSS, spriteData);
                });
            }
        );
        output.data[folder] = tree;
    });

    eventBus.emit('output_ready');
});

eventBus.on('output_ready', () => {
    console.log(":::::::::::: :::::::::::: ::::::::::::");
    console.log(util.inspect(output, false, null, true))
    console.log(":::::::::::: :::::::::::: ::::::::::::");

    fs.writeFile(`./${constants.OUTPUT_FOLDER}/structure.json`, JSON.stringify(output), (err) => {
        if (!err) {
            console.log('::::: jSON Generated');
        }
    });
});