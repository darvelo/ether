/* ============================================================================
 * Ether: mount-mapper.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

import BaseMountMapper from './base-mount-mapper';
import App from './app';
import Route from './route';
import Modified from './modified';
import mergesort from '../utils/mergesort';
import ctorName from '../utils/ctor-name';
import { is, isnt } from '../utils/is';

class MountMapper extends BaseMountMapper {
    constructor(...args) {
        super(...args);
        this._crumbMap = {};
        this._sortedCrumbs = [];
        this._mountsAdded = false;
        // a string holding the crumb representing
        // the currently-active mount on the App
        this._currentMount = null;
        // every mount activated by the App has its last params
        // stored here for diffing on its next activation
        this._lastParams = {};
    }

    _sortFn(a, b) {
        // crumbs with more slashes are are placed at the beginning
        return b.slashes - a.slashes;
    }

    mountsAdded() {
        return this._mountsAdded;
    }

    parse(crumb) {
        const NORMAL_MODE = 1;
        const PARAM_NAME_MODE = 2;
        const PARAM_VALUE_MODE = 3;

        let mode = NORMAL_MODE;
        let len = crumb.length;
        let finalRegex = [];
        // holds user-supplied properties encoded within crumb
        let paramNames = [];
        let existingParamNames = {};
        // keeps track of string position when we need to push a slice of it
        // into the RegExp, to avoid `+=` string concat performance penalty
        let leftBound = 0;
        // the current position (index) while processing the string
        let cursor = 0;
        // used to test for malformed crumb
        let bracesCount = 0;
        // will be stored in final urlmap data structure.
        // useful for sorting mapped urls by "path length"
        // to test longer paths (those with more slashes) first
        let slashesCount = 0;
        let withinNegatedCharacterClass = false;
        // since we're going to compile a RegExp,
        // we need to properly escape certain chars
        let escapes = {
            '/': '\\/',
            '\\': '\\\\',
            '[': '\\[',
            ']': '\\]',
            '(': '\\(',
            ')': '\\)',
        };

        // make leading slashes optional. this does a couple of things:
        // reflects a mount point's relative, rather than absolute, nature.
        // implicitly requires REST resource trailing-slash style to be explicit
        finalRegex.push('^\\/?');
        if (len && crumb[0] === '/') {
            // Note: a beginning slash doesn't increase the slashes count
            cursor = leftBound = 1;
        }

        for (; cursor < len; ++cursor) {
            let c = crumb[cursor];
            if (mode === NORMAL_MODE) {
                let pushSlice = false;
                let escape    = false;

                if (c === '{') {
                    mode = PARAM_NAME_MODE;
                    pushSlice = true;
                } else if (escapes[c]) {
                    if (c === '/') {
                        slashesCount++;
                    }
                    pushSlice = true;
                    escape = true;
                }

                if (pushSlice) {
                    finalRegex.push(crumb.slice(leftBound, cursor));
                    leftBound = cursor+1;
                }
                if (escape) {
                    finalRegex.push(escapes[c]);
                }
            } else if (mode === PARAM_NAME_MODE) {
                if (c === '=') {
                    mode = PARAM_VALUE_MODE;
                    let name = crumb.slice(leftBound, cursor);
                    if (existingParamNames.hasOwnProperty(name)) {
                        throw new RangeError('MountMapper: Parameter name "' + name + '" was given more than once in breadcrumb ' + crumb);
                    }
                    existingParamNames[name] = true;
                    paramNames.push(name);
                    finalRegex.push('(');
                    leftBound = cursor+1;
                } else if (escapes[c] || c === '{' || c === '}') {
                    throw new Error('Ether MountMapper: The "' + c + '" character is not allowed in a parameter name. Breadcrumb given was ' + crumb);
                }
            } else if (mode === PARAM_VALUE_MODE) {
                if (c === '^' && crumb[cursor-1] === '[') {
                    withinNegatedCharacterClass = true;
                } else if (c === ']') {
                    withinNegatedCharacterClass = false;
                } else if (c === '/' && !withinNegatedCharacterClass) {
                    throw new Error('Ether MountMapper: The "/" character is not allowed in the regex of a parameter value, unless it is part of a negated character class. Breadcrumb given was ' + crumb);
                } else if (c === '(' && crumb[cursor-1] !== '\\') {
                    let token = crumb.slice(cursor, cursor+3);
                    if (token !== '(?:' &&
                        token !== '(?=' &&
                        token !== '(?!' )
                    {
                        throw new Error('Ether MountMapper: Capturing groups are not allowed in the regex of a parameter value. Breadcrumb given was ' + crumb);
                    }
                } else if (c === '.') {
                    throw new Error('Ether MountMapper: The "." character is not allowed in the regex of a parameter value. Breadcrumb given was ' + crumb);
                } else if (c === '{') {
                    bracesCount++;
                } else if (c === '}') {
                    if (bracesCount) {
                        bracesCount--;
                    } else {
                        mode = NORMAL_MODE;
                        finalRegex.push(crumb.slice(leftBound, cursor));
                        finalRegex.push(')');
                        leftBound = cursor+1;
                    }
                }
            }
        }

        if (mode !== NORMAL_MODE) {
            throw new Error('Ether MountMapper: Malformed breadcrumb ' + crumb);
        }

        if (leftBound < cursor) {
            finalRegex.push(crumb.slice(leftBound, cursor));
        }

        // capture anything after the user-given crumb.
        // any "extra" chars will be passed along to child Apps
        finalRegex.push('(.*)');

        return {
            regex: new RegExp(finalRegex.join('')),
            paramNames: paramNames.length ? paramNames : null,
            slashes: slashesCount,
        };
    }

    _compileMountParams(mount, crumb, mountParams, parentData) {
        let parentParams = parentData.params;
        let mountParamsObj = {};
        let totalParams = Object.keys(parentParams);
        let missingParams = [];
        let conflictingParams = [];
        let expectedParams;

        if (mount instanceof Modified) {
            expectedParams = mount.klass.prototype.expectedParams();
        } else {
            expectedParams = mount.prototype.expectedParams();
        }

        mountParams.forEach(mountParam => {
            if (parentParams[mountParam]) {
                conflictingParams.push(mountParam);
            }
            mountParamsObj[mountParam] = true;
            // accumulate params and pass them forward.
            // the idea behind this is that params will accumulate and be
            // passed forward throughout the routing tree so that leaf nodes
            // can specify a subset of expected params without the
            // user having to explicitly "expect" these params for nodes
            // that don't need them on the way to the leaf.
            // if parentParams doesn't have one of the params we expect,
            // we'll know when an error is raised in the mount's constructor
            totalParams.push(mountParam);
        });

        // throw if mount's params overlap given params
        if (conflictingParams.length) {
            throw new Error([
                ctorName(parentData.parentApp),
                ' mount on "',
                crumb.replace('\\', '\\\\'),
                '" declares parameter(s) that were already declared higher in the App chain: ',
                JSON.stringify(conflictingParams),
                '.',
            ].join(''));
        }

        expectedParams.forEach(expectedParam => {
            // search for the param in the parent App's
            // (inherited) params and the mount's own params
            if (!parentParams[expectedParam] && !mountParamsObj[expectedParam]) {
                missingParams.push(expectedParam);
            }
        });

        if (missingParams.length) {
            missingParams.sort();
            throw new Error(`MyApp#mount(): The following params were not available to "${crumb}": ${JSON.stringify(missingParams)}.`);
        }

        return totalParams;
    }

    _checkMountInheritance(mount, crumb, parentApp) {
        if (mount instanceof Modified) {
            mount = mount.klass;
        }
        let obj = Object.create(mount.prototype);
        if (!(obj instanceof App) && !(obj instanceof Route)) {
            throw new TypeError(`${ctorName(parentApp)} mount "${crumb}" is not an instance of App or Route.`);
        }
    }

    _instantiateMountInstance(mount, crumb, mountParams, passedOutlets, parentData) {
        this._checkMountInheritance(mount, crumb, parentData.parentApp);

        let opts = {
            rootApp: parentData.rootApp,
            parentApp: parentData.parentApp,
            outlets: this._compileMountOutlets(mount, crumb, passedOutlets, parentData),
            params: this._compileMountParams(mount, crumb, mountParams, parentData),
            // this will be overwritten by Modified
            // if the mount is an instance of Modified
            addresses: [],
        };

        let instance = mount.create(opts);

        return {
            instance,
            addresses: instance.addresses || [],
        };
    }

    add(mounts, parentData) {
        if (this._mountsAdded) {
            throw new Error(ctorName(this) + '#add() can only be called once.');
        } else {
            this._mountsAdded = true;
        }
        if (isnt(mounts, 'Object')) {
            throw new Error(ctorName(this) + '#add() expected an object containing the mounts.');
        }
        if (isnt(parentData, 'Object')) {
            throw new Error(ctorName(this) + '#add() expected an object containing the mount\'s parent data.');
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

        let passedOutlets = {};
        let allAddresses = {};

        // make parentApp's params an easily searchable object
        parentData.params = Object.freeze(parentData.params.reduce((memo, p) => {
            memo[p] = true;
            return memo;
        }, {}));

        for (let crumb in mounts) {
            if (!mounts.hasOwnProperty(crumb)) {
                continue;
            }
            let mount = mounts[crumb];
            let parseResult = this.parse(crumb);
            let paramNames = parseResult.paramNames || [];
            let instantiationResult = this._instantiateMountInstance(mount, crumb, paramNames, passedOutlets, parentData);
            let crumbData = {
                crumb,
                mount: instantiationResult.instance,
                addresses: instantiationResult.addresses.length ? instantiationResult.addresses : null,
                regex: parseResult.regex,
                paramNames: parseResult.paramNames,
                slashes: parseResult.slashes,
            };
            if (crumbData.addresses) {
                crumbData.addresses.forEach(addr => {
                    allAddresses[addr] = true;
                });
            }
            this._sortedCrumbs.push(crumbData);
            this._crumbMap[crumb] = crumbData;
        }
        mergesort(this._sortedCrumbs, this._sortFn);
        return {
            addresses: allAddresses,
            outlets: passedOutlets,
        };
    }

    match(path) {
        let sortedCrumbs = this._sortedCrumbs;
        let crumbData, regexMatch, rest, matchLen;

        for (let i = 0, len = sortedCrumbs.length; i < len; ++i) {
            crumbData = sortedCrumbs[i];
            regexMatch = crumbData.regex.exec(path);
            if (regexMatch) {
                matchLen = regexMatch.length;
                // turn the empty string into null
                rest = regexMatch[matchLen-1] || null;
                // only Apps can have non-null `rest`
                // (extra chars to match sub-mounts in the tree)
                if (rest && (crumbData.mount instanceof Route)) {
                    regexMatch = null;
                } else {
                    break;
                }
            }
        }

        if (!regexMatch) {
            return null;
        }

        let paramNames = crumbData.paramNames;
        let namesLen = paramNames ? paramNames.length : 0;
        let crumb = crumbData.crumb;

        if (matchLen-namesLen > 2) {
            // somehow we have more params than expected,
            // even though we took match's first array val
            // and the captured value of the "rest of path" into account
            throw new Error('Ether MountMapper: The number of parameters in the given path exceeded the amount given in the breadcrumb. This is likely a bug. Path was "' + path + '" and regex was ' + crumbData.regex.source);
        }

        let ret = {
            crumb,
            rest,
            params: {},
        };
        for (let i = 0; i < namesLen; ++i) {
            let group = regexMatch[i+1];
            group = decodeURIComponent(group);
            ret.params[paramNames[i]] = group;
        }
        return ret;
    }

    setCurrentMount(crumb, params) {
        if (is(crumb, 'Null')) {
            this._currentMount = null;
            return;
        }
        if (isnt(crumb, 'String')) {
            throw new TypeError(`MountMapper#setCurrentMount(): The first argument given was not a string: ${JSON.stringify(crumb)}.`);
        }

        if (is(params, 'Null')) {
            params = {};
        } else if (isnt(params, 'Object')) {
            throw new TypeError(`MountMapper#setCurrentMount(): The second argument given was not an object or null: ${JSON.stringify(params)}.`);
        }

        let crumbData = this._crumbMap[crumb];

        if (!crumbData) {
            throw new Error(`MountMapper#setCurrentMount(): The breadcrumb "${crumb}" was not added to this MountMapper.`);
        }

        let expectedParams = crumbData.mount.expectedParams();
        expectedParams.forEach(expectedParam => {
            if (!params.hasOwnProperty(expectedParam)) {
                throw new Error(`MountMapper#setCurrentMount(): The params given for breadcrumb "${crumb}" did not match its expected params.`);
            }
        });
        if (expectedParams.length !== Object.keys(params).length) {
            throw new Error(`MountMapper#setCurrentMount(): The params given for breadcrumb "${crumb}" exceeded its expected params.`);
        }

        this._currentMount = crumb;
        this._lastParams[crumb] = Object.assign({}, params);
    }

    getCurrentMount() {
        return this._currentMount;
    }

    allMounts() {
        return this._sortedCrumbs;
    }

    allAddresses() {
        return this._sortedCrumbs.reduce((memo, crumbData) => {
            crumbData.addresses.forEach(address => memo.push(address));
            return memo;
        }, []).sort();
    }

    addressesFor(crumb) {
        let mapped = this._crumbMap[crumb];
        return mapped && (mapped.addresses || []);
    }

    mountFor(crumb) {
        let mapped = this._crumbMap[crumb];
        return mapped && mapped.mount;
    }

    regexFor(crumb) {
        let mapped = this._crumbMap[crumb];
        return mapped && mapped.regex;
    }

    paramNamesFor(crumb) {
        let mapped = this._crumbMap[crumb];
        return mapped && (mapped.paramNames || []);
    }

    lastParamsFor(crumb) {
        return this._lastParams[crumb];
    }

    slashesFor(crumb) {
        let mapped = this._crumbMap[crumb];
        return mapped && mapped.slashes;
    }

    _crumbDataFor(mount) {
        return this._sortedCrumbs.find(crumbData => crumbData.mount === mount);
    }
}

export default MountMapper;
