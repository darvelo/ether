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
                    'hasSlash/': TestRoute,
                    'noSlash': TestRoute
                };
            }
        }

        it('defaults to not stripping the trailing slash', done => {
            let dest = '/hasSlash/';
            let rootApp = new MyRootApp({});
            rootApp.navigate(dest).then(() => {
                done();
            }, () => {
                done(new Error('expected the trailing slash to be kept'));
            }).catch(done);
        });

        it('strips the trailing slash on URL passed to navigate', done => {
            let dest     = '/hasSlash/';
            let expected = '/hasSlash';
            let rootApp = new MyRootApp({stripTrailingSlash: true});
            rootApp.navigate(dest).then(() => {
                done(new Error('expected the trailing slash to be stripped, giving 404'));
            }, err => {
                expect(err).to.be.instanceof(Error);
                err.message.should.equal(`404 for path: "${expected}".`);
                done();
            }).catch(done);
        });

        it('stores fullUrl with stripped trailing slash when given a URL with a trailing slash', done => {
            let dest     = '/noSlash/';
            let expected = '/noSlash';
            let rootApp = new MyRootApp({stripTrailingSlash: true});
            rootApp.navigate(dest).then(() => {
                expect(rootApp.fullUrl).to.equal(expected);
                done();
            }, err => {
                done(new Error('expected navigation to succeed'));
            }).catch(done);
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
            }, err => {
                expect(err).to.be.instanceof(Error);
                err.message.should.equal(`404 for path: "${dest}".`);
                done();
            }).catch(done);
        });

        it('adds the trailing slash on URL passed to navigate if it is missing', done => {
            let dest = '/hasSlash';
            let rootApp = new MyRootApp({addTrailingSlash: true});
            rootApp.navigate(dest).then(() => {
                done();
            }, () => {
                done(new Error('expected the trailing slash to be added, making navigation a success'));
            }).catch(done);
        });

        it('stores fullUrl with added trailing slash when given a URL without a trailing slash', done => {
            let dest     = '/hasSlash';
            let expected = '/hasSlash/';
            let rootApp = new MyRootApp({addTrailingSlash: true});
            rootApp.navigate(dest).then(() => {
                expect(rootApp.fullUrl).to.equal(expected);
                done();
            }, err => {
                done(new Error('expected navigation to succeed'));
            }).catch(done);
        });

        it('overrides stripTrailingSlash option', done => {
            let dest = '/hasSlash/';
            let rootApp = new MyRootApp({
                stripTrailingSlash: true,
                addTrailingSlash: true,
            });
            rootApp.navigate(dest).then(() => {
                expect(rootApp.fullUrl).to.equal(dest);
                done();
            }, () => {
                done(new Error('expected the trailing slash to be added/kept, making navigation a success'));
            }).catch(done);
        });
    });
});
