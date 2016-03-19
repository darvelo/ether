import InitRunner from '../../../src/utils/init-runner';

describe('InitRunner Util', () => {
    let runner, spy1, spy2;

    beforeEach(() => {
        runner = new InitRunner();
        spy1 = sinon.spy();
        spy2 = sinon.spy();
    });

    it('runs pushed functions', () => {
        runner.push(spy1, spy2);
        spy1.should.not.have.been.called;
        spy2.should.not.have.been.called;
        runner.run();
        spy1.should.have.been.calledOnce;
        spy2.should.have.been.calledOnce;
    });

    it('can defer pushed fns execution', () => {
        runner.push(spy1, spy2);
        runner.pause();
        runner.run();
        spy1.should.not.have.been.called;
        spy2.should.not.have.been.called;
        runner.play();
        spy1.should.have.been.calledOnce;
        spy2.should.have.been.calledOnce;
    });

    it('passes then() to a real promise', done => {
        runner.push(spy1, spy2);
        let promise = runner.then(() => {
            spy1.should.have.been.calledOnce;
            spy2.should.have.been.calledOnce;
            done();
        }).catch(done);
        expect(promise).instanceof(Promise);
        runner.run();
    });
});
