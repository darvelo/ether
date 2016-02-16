import Transition from '../../../src/classes/transition';

let resolveVal = 10;
let rejectVal  = 20;

function navigateResolve() {
    return Promise.resolve(resolveVal);
}

function navigateReject() {
    return Promise.reject(rejectVal);
}

describe('Transition', () => {
    it('has the right `url`', () => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateResolve);
        transition.url.should.equal(dest);
    });

    it('starts off `state` as pending', () => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateResolve);
        transition.state.should.equal('pending');
    });

    it('sets `state` to `started` after calling `start()` method', () => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateResolve);
        transition.start();
        transition.state.should.equal('started');
    });

    it('returns a promise after `start()` method', () => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateResolve);
        expect(transition.start()).to.be.an.instanceof(Promise);
    });

    it('sets `promise` property after `start()` method', () => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateResolve);
        let promise = transition.start();
        promise.should.equal(transition.promise);
    });

    it('sets `state` to `succeeded` if promise resolves', done => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateResolve);
        transition.start().then(() => {
            transition.state.should.equal('succeeded');
            done();
        }, () => {
            done(new Error('expected promise not to reject'));
        });
    });

    it('sets `state` to `failed` if promise rejects', done => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateReject);
        transition.start().then(() => {
            done(new Error('expected promise not to resolve'));
        }, () => {
            transition.state.should.equal('failed');
            done();
        });
    });

    it('resolves with the value of the resolved promise', done => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateResolve);
        transition.start().then(val => {
            val.should.equal(resolveVal);
            done();
        }, () => {
            done(new Error('expected promise not to reject'));
        });
    });

    it('rejects with the value of the rejected promise', done => {
        let dest = 'xyz';
        let transition = new Transition(dest, navigateReject);
        transition.start().then(() => {
            done(new Error('expected promise not to resolve'));
        }, val => {
            val.should.equal(rejectVal);
            done();
        });
    });
});
