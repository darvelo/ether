import Transition from '../../../src/classes/transition';

const RESOLVE_VAL = 10;
const REJECT_VAL  = 20;
const DEST = 'xyz';
const OPTS = Object.freeze({
    woot: 1,
});

function checkArgs(url, opts) {
    if (url !== DEST) {
        throw new Error('destination url was not as expected');
    }

    if (typeof opts !== 'object' ||
        Object.keys(opts).length !== 1 ||
        opts.woot !== 1)
    {
        throw new Error('options object was not as expected');
    }
}

function navigateResolve(url, opts) {
    checkArgs(url, opts);
    return Promise.resolve(RESOLVE_VAL);
}

function navigateReject(url, opts) {
    checkArgs(url, opts);
    return Promise.reject(REJECT_VAL);
}

describe('Transition', () => {
    it('has the right `url`', () => {
        let transition = new Transition(DEST, OPTS, navigateResolve);
        transition.url.should.equal(DEST);
    });

    it('starts off `state` as pending', () => {
        let transition = new Transition(DEST, OPTS, navigateResolve);
        transition.state.should.equal('pending');
    });

    it('sets `state` to `started` after calling `start()` method', () => {
        let transition = new Transition(DEST, OPTS, navigateResolve);
        transition.start();
        transition.state.should.equal('started');
    });

    it('returns a promise after `start()` method', () => {
        let transition = new Transition(DEST, OPTS, navigateResolve);
        expect(transition.start()).to.be.an.instanceof(Promise);
    });

    it('sets `promise` property after `start()` method', () => {
        let transition = new Transition(DEST, OPTS, navigateResolve);
        let promise = transition.start();
        promise.should.equal(transition.promise);
    });

    it('sets `state` to `succeeded` if promise resolves', done => {
        let transition = new Transition(DEST, OPTS, navigateResolve);
        transition.start().then(() => {
            transition.state.should.equal('succeeded');
            done();
        }, () => {
            done(new Error('expected promise not to reject'));
        });
    });

    it('sets `state` to `failed` if promise rejects', done => {
        let transition = new Transition(DEST, OPTS, navigateReject);
        transition.start().then(() => {
            done(new Error('expected promise not to resolve'));
        }, () => {
            transition.state.should.equal('failed');
            done();
        });
    });

    it('resolves with the value of the resolved promise', done => {
        let transition = new Transition(DEST, OPTS, navigateResolve);
        transition.start().then(val => {
            val.should.equal(RESOLVE_VAL);
            done();
        }, () => {
            done(new Error('expected promise not to reject'));
        });
    });

    it('rejects with the value of the rejected promise', done => {
        let transition = new Transition(DEST, OPTS, navigateReject);
        transition.start().then(() => {
            done(new Error('expected promise not to resolve'));
        }, val => {
            val.should.equal(REJECT_VAL);
            done();
        });
    });

    it('passes destination url and options to function', () => {
        expect(() => new Transition('nope', OPTS, navigateResolve)).to.not.throw();
        expect(() => new Transition(DEST, {}, navigateResolve)).to.not.throw();
        expect(() => new Transition('nope', OPTS, navigateResolve).start()).to.throw(Error, 'destination url was not as expected');
        expect(() => new Transition(DEST, {}, navigateResolve).start()).to.throw(Error, 'options object was not as expected');
    });
});
