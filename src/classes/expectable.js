import Outlet from './outlet';
import ctorName from '../utils/ctor-name';
import { is, isnt } from '../utils/is';

const RECEIVED_NOT_ARRAY = 1;
const EXPECTED_NOT_ARRAY = 2;
const ARRAYS_NOT_EQUAL   = 3;
const EXPECTED_ANY       = 4;
const EXPECTED_NOT_MET   = 5;

class Expectable {
    constructor(opts) {
        if (isnt(opts, 'Object')) {
            throw new TypeError(ctorName(this) + ' constructor was not given an options object.');
        }

        this._checkAddresses(opts.addresses);
        this._checkOutlets(opts.outlets);
        this._checkParams(opts.params);
        this._checkSetup(opts.setup);
    }

    expectedAddresses() {
        throw new Error(ctorName(this) + ' did not implement expectedAddresses().');
    }

    addressesHandlers() {
        throw new Error(ctorName(this) + ' did not implement addressesHandlers().');
    }

    expectedOutlets() {
        throw new Error(ctorName(this) + ' did not implement expectedOutlets().');
    }

    expectedParams() {
        throw new Error(ctorName(this) + ' did not implement expectedParams().');
    }

    expectedSetup(setup) {
        throw new Error(ctorName(this) + ' did not implement expectedSetup().');
    }

    _compareArrays(array, expected, needExact=true) {
        if (!Array.isArray(array)) {
            return RECEIVED_NOT_ARRAY;
        }

        if (!Array.isArray(expected)) {
            return EXPECTED_NOT_ARRAY;
        }

        if (needExact) {
            if (array.length !== expected.length ||
                array.slice().sort().join('') !== expected.slice().sort().join(''))
            {
                return ARRAYS_NOT_EQUAL;
            }
        } else {
            // @TODO: replace with sorting smaller array + binary search,
            //        which is O(n*m*log(m)) where m is the smaller array
            let given = array.reduce((memo, val) => (memo[val] = true) && memo, {});
            for (let val of expected) {
                if (!given[val]) {
                    return EXPECTED_NOT_MET;
                }
            }
        }

        return true;
    }

    _checkAddresses(addresses) {
        let expected = this.expectedAddresses();
        let result = this._compareArrays(addresses, expected);
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
        let handlers = this.addressesHandlers();
        if (!Array.isArray(handlers)) {
            throw new TypeError(`${ctorName(this)}#addressesHandlers() did not return an Array.`);
        }
        if (expected.length !== handlers.length) {
            let ctorname = ctorName(this);
            throw new Error([
                ctorname,
                '#addressesHandlers() did not return the same number of handler functions as addresses returned by ',
                ctorname,
                '#expectedAddresses().'
            ].join(''));
        }
        let nonExistentMemberFns = [];
        let nonFns = [];
        for (let h of handlers) {
            if (is(h, 'String') && isnt(this[h], 'Function')) {
                nonExistentMemberFns.push(h);
            }
            if (isnt(h, 'String') && isnt(h, 'Function')) {
                nonFns.push(h);
            }
        }
        if (nonExistentMemberFns.length) {
            throw new Error([
                ctorName(this),
                '#addressesHandlers() references member function(s) that do not exist: ',
                JSON.stringify(nonExistentMemberFns),
                '.',
            ].join(''));
        }
        if (nonFns.length) {
            throw new Error([
                ctorName(this),
                '#addressesHandlers() returned non-function(s): ',
                JSON.stringify(nonFns),
                '.'
            ].join(''));
        }
    }

    _checkOutlets(outlets) {
        if (isnt(outlets, 'Object')) {
            throw new TypeError(ctorName(this) + ' constructor\'s options.outlets property was not an Object.');
        }

        let outletsKeys = Object.keys(outlets).sort();
        let expected = this.expectedOutlets();
        let result = this._compareArrays(outletsKeys, expected);
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
            let needExact = false;
            result = this._compareArrays(params, expected, needExact);
        }

        switch (result) {
            case RECEIVED_NOT_ARRAY:
                throw new TypeError(ctorName(this) + ' constructor\'s options.params property was not an Array.');
            case EXPECTED_NOT_ARRAY:
                throw new TypeError(ctorName(this) + '#expectedParams() did not return an Array.');
            case EXPECTED_NOT_MET:
                throw new Error([
                    ctorName(this),
                    '\'s received params ',
                        JSON.stringify(params),
                    ' did not fulfill its expected params ',
                        JSON.stringify(expected),
                    '.'
                ].join(''));
            case EXPECTED_ANY:
                return;
            case ARRAYS_NOT_EQUAL:
                throw new Error('Params given were not strictly equal to expected params. This error should never occur and is a bug. Please report this to the library developers.');
            default:
                break;
        }
    }

    _checkSetup(setup) {
        this.expectedSetup(setup);
    }
}

export default Expectable;
