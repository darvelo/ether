import NavigationStack from '../../../src/classes/navigation-stack';

describe('NavigationStack', function() {
    let stack;

    beforeEach(function() {
        stack = new NavigationStack();
    });

    it('returns undefined when the stack is empty', function() {
        expect(stack.pop()).to.not.be.ok;
    });

    it('pushes and pops navigation state', function() {
        let state = {path: 'path/to/location', params: {id: 1, name: 'bob'}};
        stack.push(state);
        stack.pop().should.equal(state);
    });

    it('allows peeking', function() {
        let state = {path: 'path/to/location', params: {id: 1, name: 'bob'}};
        expect(stack.peek()).to.not.be.ok;
        stack.push(state);
        stack.peek().should.equal(state);
    });

    it('knows when it\'s empty', function() {
        let state = {path: 'path/to/location', params: {id: 1, name: 'bob'}};
        stack.empty().should.be.ok;
        stack.push(state);
        stack.empty().should.not.be.ok;
        stack.pop();
        stack.empty().should.be.ok;
    });

    it('stores the params of the last of each path', function() {
        let path1 = 'path/1';
        let path2 = 'path/2';
        let state1 = {path: path1, params: {id: 1, name: 'bob'}};
        let state2 = {path: path2, params: {id: 1, name: 'joe'}};
        let state3 = {path: path1, params: {id: 1, name: 'bill'}};

        expect(stack.lastParams(path1)).to.not.be.ok;
        expect(stack.lastParams(path2)).to.not.be.ok;

        stack.push(state1);
        stack.lastParams(path1).should.equal(state1.params);
        stack.push(state2);
        stack.lastParams(path2).should.equal(state2.params);
        stack.push(state3);
        stack.lastParams(path1).should.equal(state3.params);
        stack.pop();
        stack.lastParams(path1).should.equal(state3.params);
        stack.pop();
        stack.lastParams(path1).should.equal(state3.params);
        stack.pop();

        stack.lastParams(path1).should.equal(state1.params);
        stack.lastParams(path2).should.equal(state2.params);
        stack.empty().should.be.ok;
    });
});
