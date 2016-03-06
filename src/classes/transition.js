class Transition {
    constructor(url, navigateFn) {
        this._url = url;
        this._navigateFn = navigateFn;
        this._state = 'pending';
        this._promise = null;
    }

    get url() { return this._url; }
    get state() { return this._state; }
    get promise() { return this._promise; }

    start() {
        if (this.state === 'pending') {
            this._state = 'started';
            this._promise = this._navigateFn(this.url).then(val => {
                this._state = 'succeeded';
                return val;
            }, err => {
                this._state = 'failed';
                return Promise.reject(err);
            });
        }

        return this.promise;
    }
}

export default Transition;
