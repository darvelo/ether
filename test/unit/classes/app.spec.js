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
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            rootApp: new RootApp({
                outlets: {
                    main: new MutableOutlet(document.createElement('div')),
                },
            }),
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
            expect(() => new TestApp(defaultOpts)).to.throw(TypeError, 'App constructor was not given a reference to the Ether RootApp.');
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

        it('MutableOutlets received are rewrapped into Outlets', () => {
            class AppWithOutlets extends App {
                expectedOutlets() {
                    return ['first'];
                }
            }
            let parent = document.createElement('div');
            let child = document.createElement('div');
            defaultOpts.outlets = {
                first: new MutableOutlet(parent),
            };
            let app = new AppWithOutlets(defaultOpts);
            expect(app).to.have.property('outlets');
            expect(app.outlets).to.be.an('object');
            expect(app.outlets.first).to.be.an.instanceof(Outlet);
            expect(app.outlets.first).to.not.be.an.instanceof(MutableOutlet);
            // we have no direct access to an Outlet's element,
            // so to make sure we still have the same element as the
            // passed-in MutableOutlet, we need to check for it indirectly
            app.outlets.first.append(child);
            expect(child.parentNode).to.equal(parent);
        });

        it('calls init() after outlets are available', () => {
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
            spy.should.have.been.calledOnce;
            spy.should.have.been.calledWith(app);
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

        it('sets `ether-deactivated` class on all outlets after createOutlets()', () => {
            let deactivatedClass = 'ether-deactivated';
            let element1 = document.createElement('div');
            let element2 = document.createElement('div');
            let element3 = document.createElement('div');
            let element4 = document.createElement('div');
            defaultOpts.outlets = {
                first: new MutableOutlet(element1),
                second: new Outlet(element2),
            };
            class AppWithOutlets extends TestApp {
                expectedOutlets() {
                    return ['first', 'second'];
                }
                createOutlets(outlets) {
                    outlets.third = new MutableOutlet(element3);
                    outlets.fourth = new MutableOutlet(element4);
                    return outlets;
                }
            }
            let app = new AppWithOutlets(defaultOpts);
            expect(element1.classList.contains(deactivatedClass)).to.equal(true);
            expect(element2.classList.contains(deactivatedClass)).to.equal(true);
            expect(element3.classList.contains(deactivatedClass)).to.equal(true);
            expect(element4.classList.contains(deactivatedClass)).to.equal(true);
        });
    });
});
