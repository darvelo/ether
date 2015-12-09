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
            expect(app).to.have.property('_outlets');
            expect(app._outlets).to.be.an('object');
            expect(app._outlets.first).to.equal(firstOutlet);
            expect(app._outlets.second).to.equal(secondOutlet);
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
            expect(app).to.have.property('_outlets');
            expect(app._outlets).to.be.an('object');
            expect(app._outlets.first).to.equal(secondOutlet);
            expect(app._outlets.second).to.equal(firstOutlet);
            expect(app._outlets.third).to.be.an.instanceof(MutableOutlet);
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
            expect(app).to.have.property('_outlets');
            expect(app._outlets).to.be.an('object');
            expect(app._outlets.first).to.be.an.instanceof(Outlet);
            expect(app._outlets.first).to.not.be.an.instanceof(MutableOutlet);
            // we have no direct access to an Outlet's element,
            // so to make sure we still have the same element as the
            // passed-in MutableOutlet, we need to check for it indirectly
            app._outlets.first.append(child);
            expect(child.parentNode).to.equal(parent);
        });
    });
});
