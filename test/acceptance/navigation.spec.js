import RootApp from '../../src/classes/root-app';
import MutableOutlet from '../../src/classes/mutable-outlet';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';

import { navTest } from '../utils/acceptance-test-generator';

class TestApp extends App {
    expectedOutlets() {
        return [];
    }
}

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe('Acceptance Tests', () => {
    let defaultOpts;

    beforeEach(() => {
        defaultOpts = {
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        };
    });

    describe('Navigation', () => {
        navTest('resolves a Promise on successful navigation', [
            '/',
        ], (done, destination) => {
            class MyRootApp extends RootApp {
                mount() {
                    return {
                        '': TestRoute,
                    };
                }
            }

            let rootApp = new MyRootApp(defaultOpts);
            rootApp.navigate(destination).then(() => {
                done();
            });
        });

        navTest('Promise rejects on 404', [
            '/nope',
        ], (done, destination) => {
            class MyRootApp extends RootApp {
                mount() {
                    return {
                        '': TestRoute,
                    };
                }
            }

            let rootApp = new MyRootApp(defaultOpts);
            rootApp.navigate(destination).then(null, err => {
                expect(err).to.be.instanceof(Error);
                err.message.should.equal(`404 for path: "${destination}".`);
                expect(err.routingTrace).to.be.an('object');
                done();
            }).catch(err => {
                // if test fails, pass error to Mocha
                done(err);
            });
        });

        navTest('and calls prerender/render on a navigated-to Route', [
            '/',
        ], (done, destination) => {
            let prerenderSpy = sinon.spy();
            let renderSpy = sinon.spy();

            class MyRoute extends TestRoute {
                prerender() {
                    prerenderSpy();
                }
                render() {
                    renderSpy();
                }
            }
            class MyRootApp extends RootApp {
                mount() {
                    return {
                        '': MyRoute,
                    };
                }
            }

            let rootApp = new MyRootApp(defaultOpts);
            prerenderSpy.should.not.have.been.called;
            renderSpy.should.not.have.been.called;
            rootApp.navigate(destination).then(() => {
                prerenderSpy.should.have.been.calledOnce;
                renderSpy.should.have.been.calledOnce;
                prerenderSpy.should.have.been.calledBefore(renderSpy);
                done();
            }).catch(err => {
                // if test fails, pass error to Mocha
                done(err);
            });
        });

        it.skip('calls prerender/render on a navigated-to Route that is within a sub-App');
        it.skip('passes to a mount\'s prerender()/render() fns params equal to its Route\'s expectedParams()');
        it.skip('passes to all conditional mounts\' prerender()/render() fns params equal to each Route\'s expectedParams()');
        it.skip('passes to a mount\'s prerender()/render() fns the proper query params');
        it.skip('passes to all conditional mounts\' prerender()/render() fns the proper query params');
        it.skip('does nothing if navigating to the same URL as the current URL');
        it.skip('throws if `routingTrace.result` is neither `success` nor `404`');

        // gotta be careful with this one.. don't wanna duplicate tests because they may eventually become out of sync
        // @TODO: use navTest() for this instead of writing individual tests
        // it.skip('navigates using an address passed with params and queryParams');
    });
});
