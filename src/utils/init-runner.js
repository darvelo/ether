/* ============================================================================
 * Ether: init-runner.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

class InitRunner {
    constructor() {
        this._inits = [];
        this._paused = false;
        let resolve;
        this._promise = new Promise(res => resolve = res);
        this._resolve = resolve;
    }

    then(...args) {
        return this._promise.then(...args);
    }

    push(...args) {
        this._inits.push(...args);
    }

    pause() {
        this._paused = true;
    }

    play() {
        this._paused = false;
        this.run();
    }

    run() {
        if (this._paused) {
            return;
        }
        this._inits.forEach(fn => fn());
        this._resolve();
    }
}

export default InitRunner;
