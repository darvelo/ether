import Outlet from '../../../../src/classes/outlet.js';

class Owner { }

describe('Outlet', function() {
    var owner;

    before(function() {
        owner = new Owner();
    });

    afterEach(function() {
        if (owner.outlet) {
            owner.outlet.clear(owner);
            owner.outlet = null;
        }
    });

    it('only allows holding an Element', function() {
        owner.outlet = new Outlet(new Element());
        expect(() => new Outlet(Object)).to.throw(Error);
    });
});
