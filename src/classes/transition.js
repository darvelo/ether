class Transition {
    constructor(url, navigateOpts, navigateFn) {
        this._url = url;
        this._navigateOpts = navigateOpts;
        this._navigateFn = navigateFn;
        this._state = 'pending';
        this._promise = new Promise((res, rej) => {
            [ this._resolve, this._reject ] = [ res, rej ];
        });
    }

    get url() { return this._url; }
    get state() { return this._state; }
    get promise() { return this._promise; }

    start() {
        if (this.state === 'pending') {
            this._state = 'started';
            this._navigateFn(this.url, this._navigateOpts).then(val => {
                this._state = 'succeeded';
                this._resolve(val);
            }, err => {
                this._state = 'failed';
                this._reject(err);
            });
        }

        return this.promise;
    }
}

export default Transition;
