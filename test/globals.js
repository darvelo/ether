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
global.Element.prototype.parentNode = {removeChild: function () { }};
