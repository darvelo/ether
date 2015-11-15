let chai = require('chai');
let sinon = require('sinon');
let sinonChai = require('sinon-chai');
let mocks = require('./mocks');

chai.should();
chai.use(sinonChai);
sinon.assert.expose(chai.assert, {prefix: ''});

global.assert = chai.assert;
global.expect = chai.expect;
global.sinon = sinon;
global.Element = mocks.Element;

require('babel-polyfill');
