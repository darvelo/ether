import RootApp from '../../src/classes/root-app';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe.only('RootApp Options', () => {
    describe('stripTrailingSlash', () => {
        class MyRootApp extends RootApp {
            expectedOutlets() {
                return [];
            }
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
        class MyRootApp extends RootApp {
            expectedOutlets() {
                return [];
            }
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
});
