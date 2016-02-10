class Transition {
    constructor(promise) {
        this._promise = promise;
        this._callbacks = [];
        this._terminated = false;
        this._handlingCallback = false;
        // functions to pass to the promise's then()
        this._iterateResolve = this._iteratePromise.bind(this, 'resolve');
        this._iterateReject  = this._iteratePromise.bind(this, 'reject');
        // allows a promise to pass its resolve/reject value
        // into the next then()/catch() callbacks.
        this._lastResult = {promise: true};
        // kick off the calling of callbacks after they are
        // all attached with synchronous calls to then()/catch()
        setTimeout(() => {
            this._handleThen();
        }, 1);
    }

    then(resolveFn, rejectFn) {
        if (typeof resolveFn !== 'function') {
            resolveFn = null;
        }
        if (typeof rejectFn !== 'function') {
            rejectFn = null;
        }
        this._callbacks.push([resolveFn || null, rejectFn || null]);
        return this;
    }

    catch(rejectFn) {
        if (typeof rejectFn !== 'function') {
            rejectFn = null;
        }
        this._callbacks.push([null, rejectFn]);
        return this;
    }

    /**
     * Remove remaining callbacks to prevent them from being called,
     * disable effects from then() and catch(), set status to terminated.
     */
    terminate() {
        let noop = function(){ return this; }.bind(this);
        this.then = this.catch = noop;
        this._callbacks.length = 0;
        this._terminated = true;
    }

    /**
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
     * Get the result of calling a resolveFn/rejectFn callback.
     * If the callback returned a promise, make that promise the
     * transition's promise from now on.
     * If the callback returned a value, store that value to send
     * to a callback on the next iteration of the promise.
     * @private
     * @param {?function} callback The function to call if the promise resolved.
     * @param {?function} lastResult The resulting value of the last promise.then()
     */
    _getCallbackResult(callback, lastResult) {
        let result;
        try {
            // set this flag so outside observers are aware
            this._handlingCallback = true;
            result = callback(lastResult);
            this._lastResult = {resolve: result};
        } catch (err) {
            // if we encountered an error executing the callback,
            // make sure we call the next available rejectFn in our
            // set of callbacks
            this._lastResult = {reject: err};
        } finally {
            // unset this flag so outside observers are aware
            this._handlingCallback = false;
            // if the callback function returned a promise,
            // set that promise as the transition's promise from now on,
            // and allow its resolved/rejected value to be passed
            // to the next callback iteration
            if (result instanceof Promise) {
                this._promise = result;
                this._lastResult = {promise: true};
            }
        }
    }

    _iteratePromise(which, result) {
        let [ resolveFn, rejectFn ] = this._callbacks.shift();
        if (this._lastResult.hasOwnProperty('promise')) {
            if (which === 'resolve') {
                // call resolveFn if the promise resolved
                this._lastResult = {resolve: result};
            } else if (which === 'reject') {
                // call rejectFn if the promise rejected
                this._lastResult = {reject: result};
            }
        }
        // skip and wait until the next callback iteration
        // if the right callback doesn't exist for the status
        // of the last iteration of the promise (resolved or rejected)
        if (resolveFn && this._lastResult.hasOwnProperty('resolve')) {
            this._getCallbackResult(resolveFn, this._lastResult.resolve);
        } else if (rejectFn && this._lastResult.hasOwnProperty('reject')) {
            this._getCallbackResult(rejectFn, this._lastResult.reject);
        }
        if (this._callbacks.length) {
            this._handleThen();
        }
    }

    _handleThen() {
        if (this._terminated || !this._callbacks.length) {
            return;
        }
        // get result from the promise and pass it to the proper callback
        this._promise = this._promise.then(this._iterateResolve, this._iterateReject);
    }
}

export default Transition;
