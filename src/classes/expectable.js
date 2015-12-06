import Outlet from './outlet';

const RECEIVED_NOT_ARRAY = 1;
const EXPECTED_NOT_ARRAY = 2;
const ARRAYS_NOT_EQUAL = 3;

class Expectable {
    constructor(opts) {
        if (typeof opts !== 'object') {
            throw new TypeError(Object.getPrototypeOf(this).constructor.name + ' constructor was not given an options object.');
        }

        this._checkAddresses(opts.addresses);
        this._checkOutlets(opts.outlets);
    }

    expectedAddresses() {
        throw new Error(Object.getPrototypeOf(this).constructor.name + ' did not implement expectedAddresses().');
    }

    expectedOutlets() {
        throw new Error(Object.getPrototypeOf(this).constructor.name + ' did not implement expectedOutlets().');
    }

    _areArraysEqual(array, expected) {
        if (!Array.isArray(array)) {
            return RECEIVED_NOT_ARRAY;
        }

        if (!Array.isArray(expected)) {
            return EXPECTED_NOT_ARRAY;
        }

        if (array.length !== expected.length ||
            array.slice().sort().join('') !== expected.slice().sort().join(''))
        {
            return ARRAYS_NOT_EQUAL;
        }

        return true;
    }

    _checkAddresses(addresses) {
        let expected = this.expectedAddresses();
        let result = this._areArraysEqual(addresses, expected);
        switch (result) {
            case RECEIVED_NOT_ARRAY:
                throw new Error(Object.getPrototypeOf(this).constructor.name + ' constructor\'s options.addresses property was not an Array.');
            case EXPECTED_NOT_ARRAY:
                throw new Error(Object.getPrototypeOf(this).constructor.name + '#expectedAdddresses() did not return an Array.');
            case ARRAYS_NOT_EQUAL:
                throw new Error([
                    Object.getPrototypeOf(this).constructor.name,
                    '\'s received addresses ',
                        JSON.stringify(addresses),
                    ' did not match its expected addresses ',
                        JSON.stringify(expected),
                    '.'
                ].join(''));
            default:
                break;
        }
    }

    _checkOutlets(outlets) {
        if (typeof outlets !== 'object') {
            throw new Error(Object.getPrototypeOf(this).constructor.name + ' constructor\'s options.outlets property was not an Object.');
        }

        let outletsKeys = Object.keys(outlets).sort();
        let expected = this.expectedOutlets();
        let result = this._areArraysEqual(outletsKeys, expected);
        switch (result) {
            case EXPECTED_NOT_ARRAY:
                throw new Error(Object.getPrototypeOf(this).constructor.name + '#expectedOutlets() did not return an Array.');
            case ARRAYS_NOT_EQUAL:
                throw new Error([
                    Object.getPrototypeOf(this).constructor.name,
                    '\'s received outlets ',
                        JSON.stringify(outletsKeys),
                    ' did not match its expected outlets ',
                        JSON.stringify(expected),
                    '.'
                ].join(''));
            default:
                break;
        }

        let nonOutlets = [];
        for (let name of outletsKeys) {
            if (!(outlets[name] instanceof Outlet)) {
                nonOutlets.push(name);
            }
        }
        if (nonOutlets.length) {
            throw new Error([
                Object.getPrototypeOf(this).constructor.name,
                ' did not receive instances of Outlet for named outlets: ',
                    JSON.stringify(nonOutlets.sort()),
                '.',
            ].join(''));
        }
    }
}

export default Expectable;
