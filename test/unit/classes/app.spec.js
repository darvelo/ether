import App from '../../../src/classes/app';
import RootApp from '../../../src/classes/root-app';
import Expectable from '../../../src/classes/expectable';
import Outlet from '../../../src/classes/outlet';
import MutableOutlet from '../../../src/classes/mutable-outlet';

class TestApp extends App {
    expectedOutlets() {
        return [];
    }
}

describe('App', function() {
    let rootApp, defaultOpts;

    beforeEach(() => {
        rootApp = new RootApp({
            _pauseInitRunner: true,
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        });
        defaultOpts = {
            rootApp,
            parentApp: rootApp,
            addresses: [],
            outlets: {},
            params: [],
        };
    });

    describe('Constructor', () => {
        it('App is an instance of Expectable', () => {
            expect(new TestApp(defaultOpts)).to.be.an.instanceof(Expectable);
        });

        it('throws if not given a rootApp', () => {
            delete defaultOpts.rootApp;
            expect(() => new TestApp(defaultOpts)).to.throw(TypeError, 'TestApp constructor was not given a reference to the Ether RootApp.');
        });

        it('throws if not given a parentApp', () => {
            delete defaultOpts.parentApp;
            expect(() => new TestApp(defaultOpts)).to.throw(TypeError, 'TestApp constructor was not given a reference to its parentApp.');
        });

        it('adds itself to the RootApp\'s address registry', () => {
            class AppWithAddresses extends App {
                expectedAddresses() {
                    return ['first', 'second'];
                }
                addressesHandlers() {
                    return [function(){},function(){}];
                }
                expectedOutlets() {
                    return [];
                }
            }
            let rootApp = defaultOpts.rootApp;
            let addresses = defaultOpts.addresses = ['first', 'second'];
            addresses.forEach(name => expect(rootApp._atAddress(name)).to.not.be.ok);
            let app = new AppWithAddresses(defaultOpts);
            addresses.forEach(name => expect(rootApp._atAddress(name)).to.equal(app));
        });

        it('stores passed-in outlets', () => {
            class AppWithOutlets extends App {
                expectedOutlets() {
                    return ['first', 'second'];
                }
            }
            let firstOutlet = new Outlet(document.createElement('div'));
            let secondOutlet = new Outlet(document.createElement('div'));
            defaultOpts.outlets = {
                first: firstOutlet,
                second: secondOutlet,
            };
            let app = new AppWithOutlets(defaultOpts);
            expect(app).to.have.property('outlets');
            expect(app.outlets).to.be.an('object');
            expect(app.outlets.first).to.equal(firstOutlet);
            expect(app.outlets.second).to.equal(secondOutlet);
        });

        it('takes ownership of outlets returned by createOutlets', () => {
            let outlet = new MutableOutlet(document.createElement('div'));
            class AppWithOutlets extends TestApp {
                createOutlets(outlets) {
                    return {
                        myOutlet: outlet,
                    };
                }
            }
            let app = new AppWithOutlets(defaultOpts);
            expect(app).to.have.property('outlets');
            expect(app.outlets.myOutlet).to.equal(outlet);
        });

        it('allows the user to create their own outlet mappings', () => {
            class AppWithOutlets extends App {
                expectedOutlets() {
                    return ['first', 'second'];
                }
                createOutlets(outlets) {
                    return {
                        first: outlets.second,
                        second: outlets.first,
                        third: new MutableOutlet(document.createElement('div')),
                    };
                }
            }
            let firstOutlet = new Outlet(document.createElement('div'));
            let secondOutlet = new Outlet(document.createElement('div'));
            defaultOpts.outlets = {
                first: firstOutlet,
                second: secondOutlet,
            };
            let app = new AppWithOutlets(defaultOpts);
            expect(app).to.have.property('outlets');
            expect(app.outlets).to.be.an('object');
            expect(app.outlets.first).to.equal(secondOutlet);
            expect(app.outlets.second).to.equal(firstOutlet);
            expect(app.outlets.third).to.be.an.instanceof(MutableOutlet);
        });

        it('calls init() after outlets are available', done => {
            let outlet = new MutableOutlet(document.createElement('div'));
            let spy = sinon.spy(function(instance) {
                expect(instance.outlets).to.deep.equal({
                    myOutlet: outlet,
                });
            });
            class AppWithOutlets extends TestApp {
                createOutlets(outlets) {
                    outlets.myOutlet = outlet;
                    return outlets;
                }
                init() {
                    spy(this);
                }
            }
            let app = new AppWithOutlets(defaultOpts);
            rootApp._inits.play();
            rootApp._inits.then(() => {
                spy.should.have.been.calledOnce;
                spy.should.have.been.calledWith(app);
                done();
            });
        });

        it('passes options.setup to init()', () => {
            defaultOpts.setup = [1, 2, 3];
            class AppWithSetup extends TestApp {
                init(setup) {
                    expect(setup).to.deep.equal([1, 2, 3]);
                }
            }
            let app = new AppWithSetup(defaultOpts);
        });

        it('initializes the state object', () => {
            let app = new TestApp(defaultOpts);
            expect(app.state).to.be.an('object');
            expect(Object.keys(app.state).sort()).to.deep.equal([
                'active',
                'inactive',
            ].sort());
        });

        it('sets the state object descriptor properly', () => {
            let app = new TestApp(defaultOpts);
            expect(Object.getOwnPropertyDescriptor(app, 'state').configurable).to.equal(false);
            expect(() => delete app.state).to.throw();
            expect(() => app.state = {}).to.throw();
        });

        it('sets the state object\'s properties\' descriptors properly', () => {
            let app = new TestApp(defaultOpts);
            for (let key of Object.keys(app.state)) {
                expect(Object.getOwnPropertyDescriptor(app.state, key).configurable).to.equal(false);
            }
        });

        it('seals the state object', () => {
            let app = new TestApp(defaultOpts);
            expect(Object.isSealed(app.state)).to.equal(true);
        });

        it('sets state to "inactive"', () => {
            let app = new TestApp(defaultOpts);
            expect(app.state).to.deep.equal({
                inactive: true,
                active: false,
            });
        });
    });

    describe('State', () => {
        it('throws when setting state to an unsupported value', () => {
            let state = 'nope';
            let app = new TestApp(defaultOpts);
            expect(() => app._setState(state)).to.throw(Error, `TestApp#_setState(): Tried to set app state to an unsupported value: ${JSON.stringify(state)}.`);
        });
    });
});
