'use strict';

const test = require('ava');
const path = require('path');
const fs = require('fs');
const del = require('del');
const mkdirp = require('mkdirp');
const bundle = require('../dist/bundler').default;
const readFileAsync = require('../dist/read-file-async').default;

const TESTDIR = '/tmp/quik-test-' + Date.now();
const WORKINGDIR = path.join(__dirname, '../template');

test.before('setup', () => del(TESTDIR, { force: true }).then(() =>
    new Promise((resolve, reject) => {
        mkdirp(TESTDIR, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    })
));

test.after('teardown', () => del(TESTDIR, { force: true }));

test('should bundle for development', t =>
    bundle({
        root: WORKINGDIR,
        entry: [ 'index.js' ],
        output: path.relative(WORKINGDIR, path.join(TESTDIR, '[name].bundle.js')),
        sourcemap: true,
        quiet: true
    })
    .then(() => readFileAsync(fs, path.join(TESTDIR, 'index.bundle.js')))
    .then(data => {
        t.truthy(data.indexOf('import React from') === -1, 'should be transpiled');
        t.truthy(data.indexOf('function _interopRequireDefault') > -1, 'should be transpiled');
        t.truthy(data.indexOf('/******/ (function(modules) { // webpackBootstrap') > -1, 'should not be minified');
        t.truthy(data.indexOf('//# sourceMappingURL=index.bundle.js.map') > -1, 'should have sourcemap');
    })
    .then(() => readFileAsync(fs, path.join(TESTDIR, 'index.bundle.js.map')))
    .then(data => {
        t.truthy(data.indexOf('"webpack:///../~/react/lib/ReactElement.js"') > -1, 'should have sourcemap');
    })
);

test('should bundle for production', t =>
    bundle({
        root: WORKINGDIR,
        entry: [ 'index.js' ],
        output: path.relative(WORKINGDIR, path.join(TESTDIR, '[name].bundle.min.js')),
        production: true,
        sourcemap: true,
        quiet: true
    })
    .then(() => readFileAsync(fs, path.join(TESTDIR, 'index.bundle.min.js')))
    .then(data => {
        t.truthy(data.indexOf('import React from') === -1, 'should be transpiled');
        t.truthy(data.indexOf('Minified exception occurred;') > -1, 'should be minified');
        t.truthy(data.indexOf('!function(e){function t(r){if(n[r])return n[r].e') > -1, 'should be minified');
        t.truthy(data.indexOf('//# sourceMappingURL=index.bundle.min.js.map') > -1, 'should have sourcemap');
    })
    .then(() => readFileAsync(fs, path.join(TESTDIR, 'index.bundle.min.js.map')))
    .then(data => {
        t.truthy(data.indexOf('"webpack:///../~/react/lib/ReactElement.js"') > -1, 'should have sourcemap');
    })
);
