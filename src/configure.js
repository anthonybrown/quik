'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const config = require('./webpack-config');

module.exports = function(options) {
    const WORKINGDIR = options.root;
    const OUTPUTFILE = options.output || '[name].bundle.js';

    return Promise.all(options.entry.map(f => {
        const file = path.join(WORKINGDIR, f);

        return new Promise((resolve, reject) => {
            fs.exists(file, (exists) => {
                if (exists) {
                    resolve(file);
                } else {
                    reject(new Error('File not found: ' + file));
                }
            });
        });
    }))
    .then(files => {
        const entry = {};

        for (let f of files) {
            entry[path.basename(f, '.js')] = f;
        }

        return webpack(Object.assign({}, config, {
            entry,
            devtool: 'source-map',
            plugins: options.production ? [
                ...config.plugins,
                new webpack.optimize.UglifyJsPlugin(),
                new webpack.optimize.OccurenceOrderPlugin()
            ] : config.plugins,
            output: {
                path: WORKINGDIR,
                filename: OUTPUTFILE,
                sourceMapFilename: OUTPUTFILE + '.map'
            }
        }));
    });
};