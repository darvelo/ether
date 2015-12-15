import Modified from './modified';
import App from './app';
import Route from './route';
import { is, isnt } from '../utils/is';
import ctorName from '../utils/ctor-name';

class ConditionalMountMapper {
    constructor() {
        this._addresses = null;
        this._acceptedOperators = ['*', '+', '!'];
        this._mounts = {};
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

    _checkMountInheritance(mount, logic, parentApp) {
        if (mount instanceof Modified) {
            mount = mount.klass;
        }
        let obj = Object.create(mount.prototype);
        if (!(obj instanceof Route)) {
            throw new TypeError(`${ctorName(parentApp)} conditional mount "${logic}" is not an instance of Route or an array of Route instances.`);
        }
    }

    _instantiateMountInstance(mount, logic, parentData) {
        let missingOutlets = [];
        let opts = {
            rootApp: parentData.rootApp,
            addresses: [],
            outlets: {},
            params: parentData.params,
        };

        this._checkMountInheritance(mount, logic, parentData.parentApp);

        function assignOptOutlets(name) {
            let outlet = parentData.outlets[name];
            if (!outlet) {
                missingOutlets.push(name);
            } else {
                opts.outlets[name] = outlet;
            }
        }

        if (mount instanceof Modified) {
            // the OutletsReceivable modifier,
            // if the user invoked it, sets this array
            if (Array.isArray(mount.outlets)) {
                mount.outlets.forEach(assignOptOutlets);
            }
            if (missingOutlets.length) {
                let ctorname = ctorName(parentData.parentApp);
                throw new Error(`${ctorname} conditional mount "${logic}" requested these outlets that ${ctorname} does not own: ${JSON.stringify(missingOutlets)}.`);
            }
            // the Setupable modifier,
            // if the user invoked it, sets this array
            if(Array.isArray(mount.setupFns)) {
                opts.setup = mount.setupFns.reduce((memo, fn) => fn(memo), undefined);
            }
        }

        return mount.create(opts);
    }

    add(logic, mounts, parentData) {
        if (isnt(mounts, 'Array')) {
            throw new Error(ctorName(this) + '#add() expected an array of mounts.');
        }
        if (isnt(parentData, 'Object')) {
            throw new Error(ctorName(this) + '#add() expected an object containing the mount\'s parent data.');
        }
        if (is(this._addresses, 'Null')) {
            throw new Error(ctorName(this) + '#add() was called but #setAddresses() needed to have been called first.');
        }
        if (!(parentData.rootApp instanceof App)) {
            throw new TypeError(ctorName(this) + '#add() did not receive an App instance for parentData.rootApp.');
        }
        if (!(parentData.parentApp instanceof App)) {
            throw new TypeError(ctorName(this) + '#add() did not receive an App instance for parentData.parentApp.');
        }

        let parseResult = this.parse(logic);
        this._mounts[logic] = {
            regex: parseResult.regex,
            mounts: mounts.map(mount => {
                return this._instantiateMountInstance(mount, logic, parentData);
            }),
        };
    }
}

export default ConditionalMountMapper;
