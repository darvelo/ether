import inherits from '../../../src/utils/inherits';

describe('Inherits Util', () => {
    it('throws if subClass is not a function or null', () => {
        expect(() => inherits(null, function(){})).to.not.throw();
        expect(() => inherits(function(){}, function(){})).to.not.throw();
        expect(() => inherits(1, function(){})).to.throw(TypeError, 'inherits(): subClass was not a function or null: 1.');
        expect(() => inherits('hi', function(){})).to.throw(TypeError, 'inherits(): subClass was not a function or null: "hi".');
    });

    it('throws if subClass is not a function or null', () => {
        expect(() => inherits(function(){}, null)).to.throw(TypeError, 'inherits(): superClass was not a function: null.');
    });

    it('copies static properties', () => {
        function SuperClass() {}
        SuperClass.staticFn = function(){};
        function SubClass() {}
        inherits(SubClass, SuperClass);
        expect(SubClass).to.not.have.ownProperty('staticFn');
        expect(SubClass.staticFn).to.equal(SuperClass.staticFn);
    });

    it('copies instance properties', () => {
        function SuperClass() {}
        SuperClass.prototype.instanceFn = function(){};
        function SubClass() {}
        inherits(SubClass, SuperClass);
        expect(SubClass.prototype).to.not.have.ownProperty('instanceFn');
        expect(SubClass.prototype.instanceFn).to.equal(SuperClass.prototype.instanceFn);
    });

    it('copies static getter/setter properties', () => {
        function getFn () {}
        function setFn () {}
        function SuperClass() {}
        Object.defineProperty(SuperClass, 'prop', {
            get: getFn,
            set: setFn,
        });
        function SubClass() {}
        inherits(SubClass, SuperClass);
        let prop = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(SubClass), 'prop');
        expect(prop.get).to.equal(getFn);
        expect(prop.set).to.equal(setFn);
    });

    it('copies instance getter/setter properties', () => {
        function getFn () {}
        function setFn () {}
        function SuperClass() {}
        Object.defineProperty(SuperClass.prototype, 'prop', {
            get: getFn,
            set: setFn,
        });
        function SubClass() {}
        inherits(SubClass, SuperClass);
        let prop = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(SubClass.prototype), 'prop');
        expect(prop.get).to.equal(getFn);
        expect(prop.set).to.equal(setFn);
    });

    it('copies passed in static properties', () => {
        function initFn() {}
        function SuperClass() {}
        function SubClass() {}
        inherits(SubClass, SuperClass, null, {
            init: initFn,
        });
        expect(SubClass.init).to.equal(initFn);
    });

    it('copies passed in instance properties', () => {
        function initFn() {}
        function SuperClass() {}
        function SubClass() {}
        inherits(SubClass, SuperClass, {
            init: initFn,
        });
        expect(SubClass.prototype.init).to.equal(initFn);
    });
});
