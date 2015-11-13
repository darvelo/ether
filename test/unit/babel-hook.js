var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);
sinon.assert.expose(chai.assert, {prefix: ''});

global.assert = chai.assert;
global.expect = chai.expect;
global.sinon = sinon;

// mock Element for browser environment
global.Element = function () { };

// put babel options here
require('babel-core/register')({
});
