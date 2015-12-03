import RootApp from '../../../src/classes/root-app';

describe('RootApp', function() {
    describe('Constructor', () => {
        it('throws if not passed an options object', () => {
            expect(() => new RootApp()).to.throw(TypeError, 'RootApp was not given an options object.');
        });
    });
});
