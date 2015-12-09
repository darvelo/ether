import RootApp from '../../src/classes/root-app';
import App from '../../src/classes/app';
import MutableOutlet from '../../src/classes/mutable-outlet';

class TestApp extends App {
    expectedOutlets() {
        return [];
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
        };
    });

    it('warns when mounts() returns an empty object', () => {
        let stub = sinon.stub(console, 'warn');
        class TestRootApp extends RootApp { }
        let rootApp = new TestRootApp(defaultOpts);
        stub.should.have.been.calledOnce;
        stub.should.have.been.calledWith('TestRootApp#mount() returned an empty object.');
        childOpts.rootApp = rootApp;
        let app = new TestApp(childOpts);
        stub.should.have.been.calledTwice;
        stub.should.have.been.calledWith('TestApp#mount() returned an empty object.');
        stub.restore();
    });
});
