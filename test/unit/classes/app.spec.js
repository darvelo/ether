import App from '../../../src/classes/app';

describe('App', function() {
    describe('Constructor', () => {
        it('throws if not passed an options object', () => {
            expect(() => new App()).to.throw(TypeError, 'App was not given an options object.');
        });

        it('throws if not given a rootApp', () => {
            expect(() => new App({})).to.throw(TypeError, 'App was not given a reference to the Ether RootApp.');
        });

        it('throws if the rootApp given in options is not an App instance', () => {
            expect(() => new App({rootApp: {}})).to.throw(TypeError, 'App was given an options object whose rootApp property was not an App instance.');
        });
    });
});
