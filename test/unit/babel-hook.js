var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

global.expect = chai.expect;
global.sinon = sinon;

function Element () {
    this.children = [];
}
Element.prototype = {
    appendChild: function(el) {
        this.children.push(el);
    },
    removeChild: function(el) {
        var children = this.children;
        var len = children.length;
        var i;
        for (i = 0; i < len; ++i) {
            if (children[i] === el) {
                return children.splice(i, 1)[0];
            }
        }

        throw new TypeError("Failed to execute 'removeChild' on 'Node': parameter 1 is not of type 'Node'.");
    },
    querySelector: function() { return true; },
    querySelectorAll: function() { return true; },
};

global.Element = Element;

// put babel options here
require('babel-core/register')({
});
