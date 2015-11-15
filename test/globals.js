var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var mocks = require('./mocks');

chai.should();
chai.use(sinonChai);
sinon.assert.expose(chai.assert, {prefix: ''});

global.assert = chai.assert;
global.expect = chai.expect;
global.sinon = sinon;
global.Element = mocks.Element;

require('babel-polyfill');
