import { is, isnt } from '../utils/is';
import ctorName from '../utils/ctor-name';

class ConditionalMountMapper {
    constructor() {
        this._addresses = null;
        this._acceptedOperators = ['*', '+', '!'];
    }

    setAddresses(addresses) {
        if (isnt(this._addresses, 'Null')) {
            throw new Error(ctorName(this) + ' only allows setting addresses once.');
        }

        if (isnt(addresses, 'Array')) {
            throw new TypeError(ctorName(this) + '#setAddresses() expects an array.');
        }

        this._addresses = {};
        for (let name of addresses) {
            this._addresses[name] = true;
        }
    }

    getAddresses() {
        if (is(this._addresses, 'Null')) {
            return null;
        }
        return Object.keys(this._addresses).sort();
    }

    parse(logic) {
        let operator = logic[0];
        logic = logic.slice(1);

        if (this._acceptedOperators.indexOf(operator) === -1) {
            throw new Error(`${ctorName(this)} only supports the initial character being one of this list: ${JSON.stringify(this._acceptedOperators)}.`);
        }

        if (operator === '*') {
            return /.*/;
        }

        let keywords = logic.split(',');
        if (operator === '+') {
            return new RegExp([
                '^(?:',
                keywords.join('|'),
                ')$',
            ].join(''));
        }
        if (operator === '!') {
            return new RegExp([
                '^(?!',
                keywords.map(kw => kw + '$').join('|'),
                ').*',
            ].join(''));
        }
    }

    add(logic, mount, opts) {
        if (is(this._addresses, 'Null')) {
            throw new Error(ctorName(this) + '#add() was called but #setAddresses() needed to have been called first.');
        }
    }
}

export default ConditionalMountMapper;
