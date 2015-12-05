class Expectable {
    constructor(opts) {
        if (typeof opts !== 'object') {
            throw new TypeError(Object.getPrototypeOf(this).constructor.name + ' constructor was not given an options object.');
        }

        this._checkAddresses(opts.addresses);
    }

    expectedAddresses() {
        throw new Error(Object.getPrototypeOf(this).constructor.name + ' did not implement expectedAddresses().');
    }

    _checkAddresses(addresses) {
        let expected = this.expectedAddresses();

        if (!Array.isArray(addresses)) {
            throw new Error(Object.getPrototypeOf(this).constructor.name + ' constructor\'s options.addresses property was not an Array.');
        }

        if (!Array.isArray(expected)) {
            throw new Error(Object.getPrototypeOf(this).constructor.name + '#expectedAdddresses() did not return an Array.');
        }

        if (addresses.length !== expected.length ||
            addresses.sort().join('') !== expected.sort().join(''))
        {
            throw new Error([
                Object.getPrototypeOf(this).constructor.name,
                '\'s received addresses ',
                    JSON.stringify(addresses),
                ' did not match its expected addresses ',
                    JSON.stringify(expected),
                '.'
            ].join(''));
        }
    }
}

export default Expectable;
