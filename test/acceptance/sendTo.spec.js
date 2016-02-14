import MyRootApp from '../utils/sendTo-acceptance-tests/app-under-test/root-app';
import { UserRoute } from '../utils/sendTo-acceptance-tests/app-under-test/root-routes';

import {
    spies,
    resetSpies,
    getAllSpyFns,
} from '../utils/sendTo-acceptance-tests/sinon-spies';

describe('sendTo()', () => {
    let rootApp;

    beforeEach(() => {
        resetSpies();
        let defaultOpts = {};
        rootApp = new MyRootApp(defaultOpts);
    });

    it('returns a promise', done => {
        let args = ['homeData'];
        spies.HomeRoute.sendToSpy.should.not.have.been.called;
        rootApp.sendTo('home', ...args).then(() => {
            spies.HomeRoute.sendToSpy.should.have.been.calledOnce;
            spies.HomeRoute.sendToSpy.should.have.been.calledWith(...args);
            delete spies.HomeRoute.sendToSpy;
            getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
            done();
        }).catch(err => {
            // if sendTo fails, pass error to Mocha
            done('sendTo promise failed: ' + err.message);
        });
    });

    it('returns the value from the called address handler', done => {
        spies.HomeRoute.sendToSpy.should.not.have.been.called;
        rootApp.sendTo('homeReturnNull').then(val => {
            expect(val).to.be.null;
            getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
            done();
        }).catch(err => {
            // if sendTo fails, pass error to Mocha
            done('sendTo promise failed: ' + err.message);
        });
    });

    it('can reject its promise', done => {
        let rejectMsg = 'error message';
        rootApp.sendTo('homeThrowError', rejectMsg).then(() => {
            done('sendTo promise resolved when it should have rejected');
        }).catch(err => {
            expect(err).to.be.an.instanceof(Error);
            err.message.should.equal(rejectMsg);
            getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
            done();
        }).catch(err => {
            // if test fails, pass error to Mocha
            done('sendTo promise failed: ' + err.message);
        });
    });

    it('can chain sendTo() promises', done => {
        let rejectMsg = 'my err';
        spies.HomeRoute.sendToSpy.should.not.have.been.called;
        rootApp.sendTo('homeReturnNull').then(val => {
            expect(val).to.be.null;
            return rootApp.sendTo('homeThrowError', rejectMsg).then(() => {
                done('expected inner sendTo() promise to reject');
            });
        }).catch(err => {
            expect(err).to.be.an.instanceof(Error);
            err.message.should.equal(rejectMsg);
            getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
            done();
        });
    });

    it('can go from an active route to another active route', done => {
        // here, since i can't get a direct handle to the route instances
        // themselves, i'm using query params to trigger sendTo() calls
        rootApp.navigate('/?sendTo=notifications&val=notified!').then(() => {
            spies.NotificationsRoute.sendToSpy.should.have.been.calledOnce;
            spies.NotificationsRoute.sendToSpy.should.have.been.calledWith('notified!');
            delete spies.NotificationsRoute;
            getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
            done();
        }).catch(err => {
            // if test fails, pass error to Mocha
            done('test failed: ' + err.message);
        });
    });

    it('can go from an active route to an inactive route', done => {
        // here, since i can't get a direct handle to the route instances
        // themselves, i'm using query params to trigger sendTo() calls
        rootApp.navigate('/?sendTo=user&val=1337').then(() => {
            spies.UserRoute.sendToSpy.should.have.been.calledOnce;
            spies.UserRoute.sendToSpy.should.have.been.calledWith(1337);
            delete spies.UserRoute;
            getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
            done();
        }).catch(err => {
            // if test fails, pass error to Mocha
            done('test failed: ' + err.message);
        });
    });

    it('can go from an inactive route to an active route', done => {
        rootApp.navigate('/').then(() => {
            getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
            return rootApp.sendTo('getUserRoute').then(userRoute => {
                expect(userRoute).to.be.an.instanceof(UserRoute);
                expect(userRoute.state).to.be.an('object');
                expect(userRoute.state.deactivated).to.be.true;
                getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);

                let data = 'data';
                return userRoute.sendTo('home', data).then(() => {
                    spies.HomeRoute.sendToSpy.should.have.been.calledOnce;
                    spies.HomeRoute.sendToSpy.should.have.been.calledWith(data);
                    delete spies.HomeRoute;
                    getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
                    done();
                });
            });
        }).catch(err => {
            // if test fails, pass error to Mocha
            done('test failed: ' + err.message);
        });
    });

    it('can go from an inactive route to another inactive route', done => {
        rootApp.navigate('/').then(() => {
            getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
            return rootApp.sendTo('getUserRoute').then(userRoute => {
                expect(userRoute).to.be.an.instanceof(UserRoute);
                expect(userRoute.state).to.be.an('object');
                expect(userRoute.state.deactivated).to.be.true;
                getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);

                let data = 'data';
                return userRoute.sendTo('userConditional', data).then(() => {
                    spies.UserConditionalRoute.sendToSpy.should.have.been.calledOnce;
                    spies.UserConditionalRoute.sendToSpy.should.have.been.calledWith(data);
                    delete spies.UserConditionalRoute;
                    getAllSpyFns(spies).forEach(spy => spy.should.not.have.been.called);
                    done();
                });
            });
        }).catch(err => {
            // if test fails, pass error to Mocha
            done('test failed: ' + err.message);
        });
    });
});
