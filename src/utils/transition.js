class Transition {
    constructor(promise) {
        this._promise = promise;
        this._callbacks = [];
        this._terminated = false;
        this._handlingCallback = false;
        // kick off the calling of callbacks after they've all been
        // attached with this transition's then() and catch() methods.
        // The setTimeout is key... it's what allows us to have access
        // to all the callbacks passed in through then() so that we
        // can wrap them.
        setTimeout(() => {
            this._attachCallbacksToPromise();
            // don't waste memory
            this._callbacks.length = 0;
        }, 1);
    }

    then(resolveFn, rejectFn) {
        this._callbacks.push([resolveFn, rejectFn]);
        return this;
    }

    catch(rejectFn) {
        this._callbacks.push([null, rejectFn]);
        return this;
    }

    /**
     * Throw on further calls to then() and catch(),
     * then() and catch() callbacks already registered
     * will be noops, isTerminated() returns `true`.
     */
    terminate() {
        function errFn() {
            throw new Error('This transition was terminated.');
        }
        this.then = this.catch = errFn;
        this._callbacks.length = 0;
        this._terminated = true;
    }

    /**
     * Returns whether the transition is terminated.
     * @return {bool} Whether the transition is terminated.
     */
    isTerminated() {
        return this._terminated;
    }

    /**
     * Returns whether a callback is currently being executed. Useful
     * when you want to change the behavior of function calls elsewhere
     * depending on whether they're being called from within a callback
     * on the transition itself.
     * Example: Allow a function to return a transition if one does not
     *          exist, but make the same function return a promise if
     *          it's called within the transition's callback so that
     *          you can chain calls to that function by returning its
     *          promise within the transition's callback, using the
     *          same transition to apply further callbacks to the new
     *          promise instead of the promise it previously held.
     * @return {bool} Whether a callback is currently being executed.
     */
    isHandlingCallback() {
        return this._handlingCallback;
    }

    /**
     * Calls the resolve or reject callback, but sets state
     * so isHandlingCallback() calls will report correctly.
     * Makes callbacks a noop if the transition has already
     * been terminated. Returns the value of the callback to
     * be used by the next set of callbacks that were previously
     * attached with then() and catch().
     * @private
     * @param {?function} callback The resolve or reject callback.
     * @param {} result The result of the last resolve or reject callback.
     * @return {} The result of `callback(result)`.
     */
    _iteratePromise(callback, result) {
        if (this.isTerminated()) {
            return;
        }
        try {
            // set this flag so outside observers are aware
            this._handlingCallback = true;
            // finally block will still execute before this return
            // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch#The_finally_clause
            return callback(result);
        } finally {
            // unset this flag so outside observers are aware
            this._handlingCallback = false;
        }
    }

    /**
     * Pass wrapped callbacks, in sequence, into this
     * transition's promise's own then() method.
     * @private
     */
    _attachCallbacksToPromise() {
        this._callbacks.reduce((promise, [ resolveFn, rejectFn ]) => {
            // pass non-function resolve and reject fns into
            // promise while wrapping those that are functions
            if (typeof resolveFn === 'function') {
                resolveFn = this._iteratePromise.bind(this, resolveFn);
            }
            if (typeof rejectFn === 'function') {
                rejectFn = this._iteratePromise.bind(this, rejectFn);
            }
            return promise.then(resolveFn, rejectFn);
        }, this._promise);
    }
}

export default Transition;
