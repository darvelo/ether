import RootApp from '../../src/classes/root-app';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe('RootApp Options', () => {
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
            let rootApp = new MyRootApp({});
            rootApp.navigate('/hasSlash/').then(() => {
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
});
