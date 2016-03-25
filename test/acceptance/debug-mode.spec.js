import RootApp from '../../src/classes/root-app';
import App from '../../src/classes/app';
import Route from '../../src/classes/route';
import MutableOutlet from '../../src/classes/mutable-outlet';

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

class OKRoute extends TestRoute { }
class ErrorRoute extends TestRoute {
    prerender() {
        throw new Error('prerender error');
    }
    deactivate() {
        throw new Error('deactivate error');
    }
    render() {
        throw new Error('render error');
    }
}

class ErrorRootApp extends RootApp {
    mount() {
        return {
            'a': ErrorRoute,
            'b': OKRoute,
        };
    }
}

describe('Debug Mode', () => {
    let defaultOpts;
    let childOpts;

    beforeEach(() => {
        defaultOpts = {
            debug: true,
            outlets: {
                main: new MutableOutlet(document.createElement('div')),
            },
        };
        childOpts = {
            addresses: [],
            outlets: {},
            params: [],
        };
    });

    describe('Construction and Initialization', () => {
        it('warns when mounts() returns an empty object', () => {
            class EmptyApp extends App {
                expectedOutlets() { return []; }
            }
            class EmptyRootApp extends RootApp { }

            let stub = sinon.stub(console, 'warn');
            let rootApp = new EmptyRootApp(defaultOpts);
            stub.should.have.been.calledOnce;
            stub.should.have.been.calledWith('EmptyRootApp#mount() returned an empty object.');
            childOpts.rootApp = rootApp;
            childOpts.parentApp = rootApp;
            let app = new EmptyApp(childOpts);
            stub.should.have.been.calledTwice;
            stub.should.have.been.calledWith('EmptyApp#mount() returned an empty object.');
            stub.restore();
        });
    });

    describe('Navigation', () => {
        it('warns about errors in Route#prerender/render/deactivate', done => {
            let stub = sinon.stub(console, 'warn');
            let rootApp = new ErrorRootApp(defaultOpts);
            stub.should.not.have.been.called;
            rootApp.navigate('a').then(() => {
                stub.should.have.callCount(4);
                stub.should.have.been.calledWith('ErrorRoute#prerender() triggered an error:');
                stub.should.have.been.calledWith(new Error('prerender error'));
                stub.should.have.been.calledWith('ErrorRoute#render() triggered an error:');
                stub.should.have.been.calledWith(new Error('render error'));
                return rootApp.navigate('b');
            }).then(() => {
                stub.should.have.callCount(6);
                stub.should.have.been.calledWith('ErrorRoute#deactivate() triggered an error:');
                stub.should.have.been.calledWith(new Error('deactivate error'));
            }).then(done).catch(done);
        });
    });
});
