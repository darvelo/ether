import Transition from '../../../src/utils/transition';

describe('Transition', () => {
    it('then() returns itself', () => {
        let transition = new Transition(Promise.resolve());
        expect(transition.then()).to.equal(transition);
    });

    it('catch() returns itself', () => {
        let transition = new Transition(Promise.resolve());
        expect(transition.catch()).to.equal(transition);
    });

    it('then() throws after terminate()', () => {
        let transition = new Transition(Promise.resolve());
        transition.terminate();
        expect(() => transition.then()).to.throw(Error, 'This transition was terminated.');
    });

    it('catch() throws after terminate()', () => {
        let transition = new Transition(Promise.resolve());
        transition.terminate();
        expect(() => transition.catch()).to.throw(Error, 'This transition was terminated.');
    });

    it('calls resolveFn when promise resolves', done => {
        new Transition(Promise.resolve()).then(done);
    });

    it('calls resolveFn with promise value when promise resolves', done => {
        new Transition(Promise.resolve(10)).then(val => {
            expect(val).to.equal(10);
            done();
        });
    });

    it('calls rejectFn when promise rejects', done => {
        new Transition(Promise.reject()).then(null, done);
    });

    it('calls rejectFn with promise value when promise rejects', done => {
        new Transition(Promise.reject(10)).then(null, val => {
            expect(val).to.equal(10);
            done();
        });
    });

    it('does not call rejectFn when promise resolves', done => {
        new Transition(Promise.resolve()).then(() => {
            done();
        }, () => {
            done(new Error('Called resolveFn on a rejected promise.'));
        });
    });

    it('does not call resolveFn when promise rejects', done => {
        new Transition(Promise.reject()).then(() => {
            done(new Error('Called resolveFn on a rejected promise.'));
        }, () => {
            done();
        });
    });

    it('resolves after a rejectFn returns', done => {
        new Transition(Promise.reject())
            .then(() => done(new Error('Called resolveFn.')), () => null)
            .then(done, () => done(new Error('Called rejectFn.')));
    });

    it('rejects if an error is thrown in resolveFn', done => {
        new Transition(Promise.resolve())
            .then(() => {
                throw new Error('err');
            }, () => {
                done(new Error('Called rejectFn.'));
            }).then(() => {
                done(new Error('Called resolveFn.'));
            }, err => {
                expect(err.message).to.equal('err');
                done();
            });
    });

    it('rejects if an error is thrown in rejectFn', done => {
        new Transition(Promise.reject())
            .then(() => {
                done(new Error('Called resolveFn.'));
            }, () => {
                throw new Error('err');
            }).then(() => {
                done(new Error('Called resolveFn.'));
            }, err => {
                expect(err.message).to.equal('err');
                done();
            });
    });

    it('chains resolved promises and does not call any rejectFns', done => {
        new Transition(Promise.resolve())
            .then(() => null, () => done(new Error('Called a rejectFn.')))
            .then(() => null, () => done(new Error('Called a rejectFn.')))
            .then(() => null, () => done(new Error('Called a rejectFn.')))
            .then(() => null, () => done(new Error('Called a rejectFn.')))
            .then(done,       () => done(new Error('Called a rejectFn.')));
    });

    it('chains resolved promises and passes values forward', done => {
        new Transition(Promise.resolve(1))
            .then(val => {
                expect(val).to.equal(1);
                return 2;
            }, () => done(new Error('Called a rejectFn.')))
            .then(val => {
                expect(val).to.equal(2);
                return 3;
            }, () => done(new Error('Called a rejectFn.')))
            .then(val => {
                expect(val).to.equal(3);
                return 4;
            }, () => done(new Error('Called a rejectFn.')))
            .then(val => {
                expect(val).to.equal(4);
                return 5;
            }, () => done(new Error('Called a rejectFn.')))
            .then(val => {
                expect(val).to.equal(5);
                done();
            }, () => done(new Error('Called a rejectFn.')));
    });

    it('passes resolved values forward if then() contains no resolveFn', done => {
        new Transition(Promise.resolve(1))
            .then(null, () => done(new Error('Called a rejectFn')))
            .then(null, () => done(new Error('Called a rejectFn')))
            .then(null, () => done(new Error('Called a rejectFn')))
            .then(val => {
                expect(val).to.equal(1);
                done();
            }, () => {
                done(new Error('Called a rejectFn'));
            });
    });

    it('passes rejected values forward if then() contains no rejectFn', done => {
        new Transition(Promise.reject(1))
            .then(() => done(new Error('Called a resolveFn')), null)
            .then(() => done(new Error('Called a resolveFn')), null)
            .then(() => done(new Error('Called a resolveFn')), null)
            .then(() => {
                done(new Error('Called a resolveFn'));
            }, val => {
                expect(val).to.equal(1);
                done();
            });
    });

    it('on resolve, passes the resolve result of a returned promise forward', done => {
        new Transition(Promise.resolve(1))
            .then(() => Promise.resolve(2), () => done(new Error('Called a rejectFn')))
            .then(val => {
                expect(val).to.equal(2);
                done();
            }, () => {
                done(new Error('Called a rejectFn'));
            });
    });

    it('on resolve, passes the reject result of a returned promise forward', done => {
        new Transition(Promise.resolve(1))
            .then(() => Promise.reject(2), () => done(new Error('Called a rejectFn.')))
            .then(() => {
                done(new Error('Called a resolveFn.'));
            }, val => {
                expect(val).to.equal(2);
                done();
            });
    });

    it('on reject, passes the resolve result of a returned promise forward', done => {
        new Transition(Promise.reject(1))
            .then(() => done(new Error('Called a resolveFn.')), () => Promise.resolve(2))
            .then(val => {
                expect(val).to.equal(2);
                done();
            }, () => {
                done(new Error('Called a rejectFn'));
            });
    });

    it('on reject, passes the reject result of a returned promise forward', done => {
        new Transition(Promise.reject(1))
            .then(() => done(new Error('Called a resolveFn.')), () => Promise.reject(2))
            .then(() => {
                done(new Error('Called a resolveFn'));
            }, val => {
                expect(val).to.equal(2);
                done();
            });
    });

    it('catches an error down the line and resolves afterward', done => {
        new Transition(Promise.reject(1))
            .then(() => done(new Error('Called a resolveFn.')))
            .then(() => done(new Error('Called a resolveFn.')))
            .then(() => done(new Error('Called a resolveFn.')))
            .then(() => done(new Error('Called a resolveFn.')))
            .catch(val => {
                expect(val).to.equal(1);
                return 2;
            })
            .then(val => {
                expect(val).to.equal(2);
                done();
            });
    });

    it('can terminate early', done => {
        let transition = new Transition(Promise.resolve());
        transition.then(() => {
            transition.terminate();
            setTimeout(done, 100);
        }).then(() => {
            done(new Error('Transition kept iterating through promise.'));
        }, () => {
            done(new Error('Transition kept iterating through promise.'));
        }).catch(() => {
            done(new Error('Transition kept iterating through promise.'));
        });
    });

    it('uses null for resolve callback if not passed a function', done => {
        new Transition(Promise.resolve(1))
            .then('xyz', () => done(new Error('Called rejectFn.')))
            .then(val => {
                expect(val).to.equal(1);
                done();
            }, () => {
                done(new Error('Called rejectFn.'));
            });
    });

    it('uses null for reject callback if not passed a function', done => {
        new Transition(Promise.reject(1))
            .then(() => done(new Error('Called resolveFn.')), 'xyz')
            .then(() => {
                done(new Error('Called resolveFn!.'));
            }, val => {
                expect(val).to.equal(1);
                done();
            });
    });
});
