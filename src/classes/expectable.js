import Outlet from './outlet';
import ctorName from '../utils/ctor-name';
import { isnt } from '../utils/is';

const RECEIVED_NOT_ARRAY = 1;
const EXPECTED_NOT_ARRAY = 2;
const ARRAYS_NOT_EQUAL = 3;
const EXPECTED_ANY = 4;

class Expectable {
    constructor(opts) {
        if (isnt(opts, 'Object')) {
            throw new TypeError(ctorName(this) + ' constructor was not given an options object.');
        }

        this._checkAddresses(opts.addresses);
        this._checkOutlets(opts.outlets);
        this._checkParams(opts.params);
    }

    expectedAddresses() {
        throw new Error(ctorName(this) + ' did not implement expectedAddresses().');
    }

    expectedOutlets() {
        throw new Error(ctorName(this) + ' did not implement expectedOutlets().');
    }

    expectedParams() {
        throw new Error(ctorName(this) + ' did not implement expectedParams().');
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
                throw new TypeError(ctorName(this) + ' constructor\'s options.addresses property was not an Array.');
            case EXPECTED_NOT_ARRAY:
                throw new TypeError(ctorName(this) + '#expectedAddresses() did not return an Array.');
            case ARRAYS_NOT_EQUAL:
                throw new Error([
                    ctorName(this),
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
        if (isnt(outlets, 'Object')) {
            throw new TypeError(ctorName(this) + ' constructor\'s options.outlets property was not an Object.');
        }

        let outletsKeys = Object.keys(outlets).sort();
        let expected = this.expectedOutlets();
        let result = this._areArraysEqual(outletsKeys, expected);
        switch (result) {
            case EXPECTED_NOT_ARRAY:
                throw new TypeError(ctorName(this) + '#expectedOutlets() did not return an Array.');
            case ARRAYS_NOT_EQUAL:
                throw new Error([
                    ctorName(this),
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
            throw new TypeError([
                ctorName(this),
                ' did not receive instances of Outlet for named outlets: ',
                    JSON.stringify(nonOutlets.sort()),
                '.',
            ].join(''));
        }
    }

    _checkParams(params) {
        let expected = this.expectedParams();
        let result;

        if (expected === '*' && Array.isArray(params)) {
            result = EXPECTED_ANY;
        } else {
            result = this._areArraysEqual(params, expected);
        }

        switch (result) {
            case RECEIVED_NOT_ARRAY:
                throw new TypeError(ctorName(this) + ' constructor\'s options.params property was not an Array.');
            case EXPECTED_NOT_ARRAY:
                throw new TypeError(ctorName(this) + '#expectedParams() did not return an Array.');
            case ARRAYS_NOT_EQUAL:
                throw new Error([
                    ctorName(this),
                    '\'s received params ',
                        JSON.stringify(params),
                    ' did not match its expected params ',
                        JSON.stringify(expected),
                    '.'
                ].join(''));
            case EXPECTED_ANY:
                return;
            default:
                break;
        }
    }
}

export default Expectable;
