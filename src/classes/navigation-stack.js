class NavigationStack {
    constructor() {
        this._stack = [];
        this._lastParams = {};
    }

    push(state) {
        this._lastParams[state.path] = state.params;
        this._stack.push(state);
    }

    pop() {
        let lastState = this._stack.pop();
        if (lastState) {
            this._lastParams[lastState.path] = lastState.params;
        }
        return lastState;
    }

    peek() {
        return this._stack[this._stack.length-1];
    }

    empty() {
        return !this._stack.length;
    }

    lastParams(path) {
        return this._lastParams[path];
    }
}

export default NavigationStack;
