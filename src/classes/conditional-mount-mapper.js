import BaseMountMapper from './base-mount-mapper';
import Modified from './modified';
import App from './app';
import Route from './route';
import { is, isnt } from '../utils/is';
import ctorName from '../utils/ctor-name';

class ConditionalMountMapper extends BaseMountMapper {
    constructor(...args) {
        super(...args);
        this._addresses = null;
        this._outlets = null;
        this._acceptedOperators = ['*', '+', '!'];
        this._mounts = {};
    }

    setAddresses(addresses) {
        if (isnt(this._addresses, 'Null')) {
            throw new Error(ctorName(this) + ' only allows setting addresses once.');
        }

        if (isnt(addresses, 'Object')) {
            throw new TypeError(ctorName(this) + '#setAddresses() expects an object.');
        }

        this._addresses = addresses;
    }

    setOutlets(outlets) {
        if (isnt(this._outlets, 'Null')) {
            throw new Error(ctorName(this) + ' only allows setting outlets once.');
        }

        if (isnt(outlets, 'Object')) {
            throw new TypeError(ctorName(this) + '#setOutlets() expects an object.');
        }

        this._outlets = outlets;
    }

    parse(logic) {
        let operator = logic[0];

        if (this._acceptedOperators.indexOf(operator) === -1) {
            throw new Error(`${ctorName(this)} only supports the initial character being one of this list: ${JSON.stringify(this._acceptedOperators)}.`);
        }

        // the empty string means no addresses
        let addresses = logic.slice(1);
        if (addresses) {
            addresses = addresses.split(',');
        } else if (operator !== '*') {
            throw new Error('Conditional mounts that are not "*" require a comma-delimited list of required addresses.');
        } else {
            addresses = [];
        }

        let regex;
        switch (operator) {
            case '*':
                regex = /.*/;
                break;
            case '+':
                regex = new RegExp([
                    '^(?:',
                    addresses.join('|'),
                    ')$',
                ].join(''));
                break;
            case '!':
                regex = new RegExp([
                    '^(?!',
                    addresses.map(addr => addr + '$').join('|'),
                    ').*',
                ].join(''));
                break;
            default:
                break;
        }

        return {
            operator,
            addresses,
            regex,
        };
    }

    _compileMountParams(mount, parentData) {
        let parentParams = parentData.params.reduce((memo, p) => memo[p] = true && memo, {});
        let totalParams = [];
        let expectedParams;

        if (mount instanceof Modified) {
            expectedParams = mount.klass.prototype.expectedParams();
        } else {
            expectedParams = mount.prototype.expectedParams();
        }

        for (let expectedParam of expectedParams) {
            if (parentParams[expectedParam]) {
                totalParams.push(expectedParam);
            }
        }

        return totalParams;
    }

    _checkMountInheritance(mount, logic, parentApp) {
        if (mount instanceof Modified) {
            mount = mount.klass;
        }
        let obj = Object.create(mount.prototype);
        if (!(obj instanceof Route)) {
            throw new TypeError(`${ctorName(parentApp)} conditional mount "${logic}" is not an instance of Route or an array of Route instances.`);
        }
    }

    _instantiateMountInstance(mount, logic, passedOutlets, parentData) {
        this._checkMountInheritance(mount, logic, parentData.parentApp);

        let opts = {
            rootApp: parentData.rootApp,
            addresses: this._compileMountAddresses(mount),
            outlets: this._compileMountOutlets(mount, logic, passedOutlets, parentData, true),
            setup: this._compileMountSetupFns(mount),
            params: this._compileMountParams(mount, parentData),
        };

        return mount.create(opts);
    }

    add(mounts, parentData) {
        if (isnt(mounts, 'Object')) {
            throw new Error(ctorName(this) + '#add() expected an object of mounts.');
        }
        if (isnt(parentData, 'Object')) {
            throw new Error(ctorName(this) + '#add() expected an object containing the mount\'s parent data.');
        }
        if (is(this._addresses, 'Null')) {
            throw new Error(ctorName(this) + '#add() was called but #setAddresses() needed to have been called first.');
        }
        if (is(this._outlets, 'Null')) {
            throw new Error(ctorName(this) + '#add() was called but #setOutlets() needed to have been called first.');
        }
        if (!(parentData.rootApp instanceof App)) {
            throw new TypeError(ctorName(this) + '#add() did not receive an App instance for parentData.rootApp.');
        }
        if (!(parentData.parentApp instanceof App)) {
            throw new TypeError(ctorName(this) + '#add() did not receive an App instance for parentData.parentApp.');
        }
        if (isnt(parentData.outlets, 'Object')) {
            throw new TypeError(ctorName(this) + '#add() did not receive an object for parentData.outlets.');
        }
        if (isnt(parentData.params, 'Array')) {
            throw new TypeError(ctorName(this) + '#add() did not receive an array for parentData.params.');
        }

        let self = this;
        let passedOutlets = this._outlets;

        function mapMountInstance(logic) {
            return function(mount) {
                return self._instantiateMountInstance(mount, logic, passedOutlets, parentData);
            };
        }

        for (let logic in mounts) {
            if (!mounts.hasOwnProperty(logic)) {
                continue;
            }
            let mountsList = mounts[logic];
            if (!Array.isArray(mountsList)) {
                mountsList = [mountsList];
            }
            if (mountsList.length === 0 || mountsList.length === 1 && is(mountsList[0], 'Undefined')) {
                throw new Error(ctorName(this) + '#add() received an empty array for a mount.');
            }
            let parseResult = this.parse(logic);
            let unknownAddresses = parseResult.addresses.filter(addy => !this._addresses[addy]).sort();
            if (unknownAddresses.length) {
                let ctorname = ctorName(parentData.parentApp);
                throw new Error([
                    ctorname,
                    '#mountConditionals() requires addresses that are not created in ',
                    ctorname,
                    '#mount(): ',
                    JSON.stringify(unknownAddresses),
                    '.',
                ].join(''));
            }
            this._mounts[logic] = {
                regex: parseResult.regex,
                mounts: mountsList.map(mapMountInstance(logic)),
            };
        }
    }
}

export default ConditionalMountMapper;
