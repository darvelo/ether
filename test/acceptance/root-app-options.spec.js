import RootApp from '../../src/classes/root-app';
import Route from '../../src/classes/route';

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

class TestRootApp extends RootApp {
    expectedOutlets() {
        return [];
    }
}

describe('RootApp Options', () => {
    describe('basePath', () => {
        it('has encodeURI() called on it', () => {
            let rootApp = new TestRootApp({basePath: '/hello world/'});
            expect(rootApp._config.basePath).to.equal('/hello%20world/');
        });
    });

    describe('stripTrailingSlash', () => {
        class MyRootApp extends TestRootApp {
            mount() {
                return {
                    'hasSlash/' : TestRoute,
                };
            }
        }

        it('defaults to not stripping the trailing slash', done => {
            let dest = '/hasSlash/';
            let rootApp = new MyRootApp({});
            rootApp.navigate(dest).then(() => {
                done();
            }).catch(() => {
                done(new Error('expected the trailing slash to be kept'));
            });
        });

        it('strips the trailing slash on URL passed to navigate', done => {
            let dest = '/hasSlash/';
            let rootApp = new MyRootApp({stripTrailingSlash: true});
            rootApp.navigate(dest).then(() => {
                done(new Error('expected the trailing slash to be stripped, giving 404'));
            }).catch(err => {
                expect(err).to.be.instanceof(Error);
                err.message.should.equal(`404 for path: "${dest}".`);
                done();
            });
        });
    });

    describe('addTrailingSlash', () => {
        class MyRootApp extends TestRootApp {
            mount() {
                return {
                    'hasSlash/' : TestRoute,
                };
            }
        }

        it('defaults to not adding the trailing slash', done => {
            let dest = '/hasSlash';
            let rootApp = new MyRootApp({});
            rootApp.navigate(dest).then(() => {
                done(new Error('expected the trailing slash to not be added'));
            }).catch(err => {
                expect(err).to.be.instanceof(Error);
                err.message.should.equal(`404 for path: "${dest}".`);
                done();
            });
        });

        it('adds the trailing slash on URL passed to navigate if it is missing', done => {
            let dest = '/hasSlash';
            let rootApp = new MyRootApp({addTrailingSlash: true});
            rootApp.navigate(dest).then(() => {
                done();
            }).catch(() => {
                done(new Error('expected the trailing slash to be added, making navigation a success'));
            });
        });

        it('overrides stripTrailingSlash option', done => {
            let dest = '/hasSlash/';
            let rootApp = new MyRootApp({
                stripTrailingSlash: true,
                addTrailingSlash: true,
            });
            rootApp.navigate(dest).then(() => {
                done();
            }).catch(() => {
                done(new Error('expected the trailing slash to be added/kept, making navigation a success'));
            });
        });
    });

    describe('Transition Queueing', () => {
        class MyRootApp extends TestRootApp {
            mount() {
                return {
                    'first' : TestRoute,
                    'second' : TestRoute,
                };
            }
        }

        it('queues transitions', done => {
            let rootApp = new MyRootApp({});
            let firstTransition, secondTransition;

            expect(rootApp.getCurrentTransition()).to.be.null;
            expect(rootApp._transitionQueue).to.be.an('array');
            expect(rootApp._transitionQueue).to.be.empty;

            rootApp.navigate('first?x=1').then(() => {
                expect(firstTransition).to.be.ok;
                expect(firstTransition.state).to.equal('succeeded');
            }).catch(() => {
                done(new Error('expected first navigation to succeed'));
            });

            firstTransition = rootApp.getCurrentTransition();
            expect(firstTransition.url).to.equal('first?x=1');
            expect(firstTransition.state).to.equal('started');
            expect(rootApp._transitionQueue).to.be.empty;

            rootApp.navigate('second').then(() => {
                expect(firstTransition).to.be.ok;
                expect(firstTransition.state).to.equal('succeeded');
                expect(rootApp.getCurrentTransition()).to.equal(secondTransition);
                expect(secondTransition.state).to.equal('succeeded');
                done();
            }).catch(() => {
                done(new Error('expected second navigation to succeed'));
            });

            expect(rootApp._transitionQueue).to.have.length(1);
            secondTransition = rootApp._transitionQueue[0];
            expect(secondTransition.url).to.equal('second');
            expect(secondTransition.state).to.equal('pending');
            expect(secondTransition).to.not.equal(firstTransition);
        });

        it('continues transition queue even if some fail', done => {
            let rootApp = new MyRootApp({});
            let firstTransition, secondTransition;

            expect(rootApp.getCurrentTransition()).to.be.null;
            expect(rootApp._transitionQueue).to.be.an('array');
            expect(rootApp._transitionQueue).to.be.empty;

            rootApp.navigate('non-existent-url').then(() => {
                done(new Error('expected first navigation to fail'));
            }).catch(() => {
                expect(firstTransition).to.be.ok;
                expect(firstTransition.state).to.equal('failed');
            });

            firstTransition = rootApp.getCurrentTransition();
            expect(firstTransition.url).to.equal('non-existent-url');
            expect(firstTransition.state).to.equal('started');
            expect(rootApp._transitionQueue).to.be.empty;

            rootApp.navigate('second').then(() => {
                expect(firstTransition).to.be.ok;
                expect(firstTransition.state).to.equal('failed');
                expect(rootApp.getCurrentTransition()).to.equal(secondTransition);
                expect(secondTransition.state).to.equal('succeeded');
                done();
            }).catch(() => {
                done(new Error('expected second navigation to succeed'));
            });

            expect(rootApp._transitionQueue).to.have.length(1);
            secondTransition = rootApp._transitionQueue[0];
            expect(secondTransition.url).to.equal('second');
            expect(secondTransition.state).to.equal('pending');
            expect(secondTransition).to.not.equal(firstTransition);
        });
    });
});
