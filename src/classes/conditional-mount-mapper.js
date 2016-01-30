import BaseMountMapper from './base-mount-mapper';
import MountMapper from './mount-mapper';
import Modified from './modified';
import App from './app';
import Route from './route';
import { isnt } from '../utils/is';
import ctorName from '../utils/ctor-name';

class ConditionalMountMapper extends BaseMountMapper {
    constructor(...args) {
        super(...args);
        this._acceptedOperators = ['*', '+', '!'];
        this._mounts = {};
        this._mountsAdded = false;
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
            logic,
            addresses,
            regex,
        };
    }

    _testParamByOperator(parseResult, addressesParams, expectedParam) {
        let operator = parseResult.operator;
        let regex = parseResult.regex;
        let addresses = parseResult.addresses;
        switch (operator) {
            // + operator requires expected param to be in every mount
            // listed on the `+` list (if not already in parentApp params)
            case '+':
                for (let addr of addresses) {
                    if (!addressesParams[addr][expectedParam]) {
                        return false;
                    }
                }
                return true;
            // * operator requires expected param to be in every mount
            // (if not already in parentApp params)
            case '*':
                for (let addr in addressesParams) {
                    if (addressesParams.hasOwnProperty(addr) && !addressesParams[addr][expectedParam]) {
                        return false;
                    }
                }
                return true;
            // ! operator requires expected param to be in every mount
            // _not_ listed on the `!` list (if not already in parentApp params)
            case '!':
                for (let addr in addressesParams) {
                    if (addressesParams.hasOwnProperty(addr) && regex.test(addr) && !addressesParams[addr][expectedParam]) {
                        return false;
                    }
                }
                return true;
            default:
                return false;
        }
    }

    _compileMountParams(mount, parseResult, parentData) {
        let parentParams = parentData.params;
        let addressesParams = parentData.addressesParams;
        let missingParams = [];
        let totalParams = [];
        let expectedParams;

        if (mount instanceof Modified) {
            expectedParams = mount.klass.prototype.expectedParams();
        } else {
            expectedParams = mount.prototype.expectedParams();
        }

        for (let expectedParam of expectedParams) {
            // search for the param in the parent App's (inherited) params
            if (parentParams[expectedParam]) {
                totalParams.push(expectedParam);
            // search for the param in all relevant routes depending on the operator
            } else if (this._testParamByOperator(parseResult, addressesParams, expectedParam)) {
                totalParams.push(expectedParam);
            } else {
                missingParams.push(expectedParam);
            }
        }

        if (missingParams.length) {
            missingParams.sort();
            throw new Error(`MyApp#mountConditionals(): Not every mount referenced in "${parseResult.logic}" had these params available: ${JSON.stringify(missingParams)}.`);
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

    _instantiateMountInstance(mount, parseResult, passedOutlets, parentData) {
        let logic = parseResult.logic;
        let isConditionalMapper = true;

        this._checkMountInheritance(mount, logic, parentData.parentApp);

        let opts = {
            rootApp: parentData.rootApp,
            addresses: this._compileMountAddresses(mount),
            outlets: this._compileMountOutlets(mount, logic, passedOutlets, parentData, isConditionalMapper),
            setup: this._compileMountSetupFns(mount),
            params: this._compileMountParams(mount, parseResult, parentData),
        };

        return mount.create(opts);
    }

    add(mounts, parentData) {
        if (this._mountsAdded) {
            throw new Error(ctorName(this) + '#add() can only be called once.');
        } else {
            this._mountsAdded = true;
        }
        if (isnt(mounts, 'Object')) {
            throw new TypeError(ctorName(this) + '#add() expected an object of mounts.');
        }
        if (isnt(parentData, 'Object')) {
            throw new TypeError(ctorName(this) + '#add() expected an object containing the mount\'s parent data.');
        }
        if (isnt(parentData.mountsMetadata, 'Object')) {
            throw new TypeError(ctorName(this) + '#add() did not receive an object for parentData.mountsMetadata.');
        }
        if (isnt(parentData.mountsMetadata.addresses, 'Object')) {
            throw new TypeError(ctorName(this) + '#add() did not receive an object for parentData.mountsMetadata.addresses.');
        }
        if (isnt(parentData.mountsMetadata.outlets, 'Object')) {
            throw new TypeError(ctorName(this) + '#add() did not receive an object for parentData.mountsMetadata.outlets.');
        }
        if (!(parentData.mountMapper instanceof MountMapper)) {
            throw new TypeError(ctorName(this) + '#add() did not receive an instance of MountMapper for parentData.mountMapper.');
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
        // a hash with keys representing addresses created
        // locally on the App owning this ConditionalMountMapper.
        // a whitelist of addresses a conditional mount can reference.
        let availableAddresses = parentData.mountsMetadata.addresses;
        // a hash with keys representing names of outlets already claimed by
        // mounts created locally on the App owning this ConditionalMountMapper.
        // a blacklist of outlets a conditional mount cannot be passed
        // because they've already been attached to a mount.
        let passedOutlets = parentData.mountsMetadata.outlets;

        // make parentApp's params an easily searchable object
        parentData.params = Object.freeze(parentData.params.reduce((memo, p) => memo[p] = true && memo, {}));
        // create a map from each address in parentApp's mounts to all the params in their crumbs
        parentData.addressesParams = parentData.mountMapper.allMounts().reduce((memo, crumbData) => {
            let params = {};
            if (crumbData.paramNames) {
                crumbData.paramNames.forEach(paramName => params[paramName] = true);
            }
            if (crumbData.addresses) {
                for (let addr of crumbData.addresses) {
                    memo[addr] = params;
                }
            }
            return memo;
        }, {});

        function filterUnknownAddresses(addy) {
            return !availableAddresses[addy];
        }

        function mapMountInstance(parseResult) {
            return function(mount) {
                return self._instantiateMountInstance(mount, parseResult, passedOutlets, parentData);
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
            if (mountsList.length === 0) {
                throw new Error(ctorName(this) + '#add() received an empty array for a mount.');
            }
            let parseResult = this.parse(logic);
            let unknownAddresses = parseResult.addresses.filter(filterUnknownAddresses).sort();
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
                operator: parseResult.operator,
                regex: parseResult.regex,
                mounts: mountsList.map(mapMountInstance(parseResult)),
            };
        }
    }

    match(addresses) {
        let matched = {};
        for (let logic in this._mounts) {
            if (!this._mounts.hasOwnProperty(logic)) {
                continue;
            }
            let mountData = this._mounts[logic];
            let { operator, regex } = mountData;
            for (let address of addresses) {
                switch (operator) {
                    // * is always added to the list
                    case '*':
                        matched[logic] = true;
                        break;
                    // + acts as an OR operation, adding any logic crumb
                    // that matches any of the listed addresses
                    case '+':
                        if (regex.test(address)) {
                            matched[logic] = true;
                        }
                        break;
                    // ! acts as an AND operation
                    // (NOT this address AND NOT this address)
                    // so we need to blacklist this logic crumb from being
                    // re-added if one address failed the regex test but a
                    // subsequent address passed it
                    case '!':
                        if (matched[logic] !== false) {
                            if (regex.test(address)) {
                                matched[logic] = true;
                            } else {
                                matched[logic] = false;
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        // remove those that were marked for removal by `!`
        for (let logic in matched) {
            if (matched.hasOwnProperty(logic) && matched[logic] === false) {
                delete matched[logic];
            }
        }
        matched = Object.keys(matched);
        return matched.length ? matched : null;
    }
}

export default ConditionalMountMapper;
