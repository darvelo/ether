import BaseMountMapper from './base-mount-mapper';
import App from './app';
import Route from './route';
import Modified from './modified';
import mergesort from '../utils/mergesort';
import ctorName from '../utils/ctor-name';
import { isnt } from '../utils/is';

function isNumeric(str) {
    return !isNaN(str);
}

class MountMapper extends BaseMountMapper {
    constructor(...args) {
        super(...args);
        this._crumbMap = {};
        this._sortedCrumbs = [];
        this._outlets = {};
    }

    _sortFn(a, b) {
        // crumbs with more slashes are are placed at the beginning
        return b.slashes - a.slashes;
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

        finalRegex.push('^');

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
                    if (existingParamNames[name]) {
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
                if (c === '/') {
                    throw new Error('Ether MountMapper: The "/" character is not allowed in the regex of a parameter value. Breadcrumb given was ' + crumb);
                } else if (c === '(' && crumb[cursor-1] !== '\\') {
                    let token = crumb.slice(cursor, cursor+3);
                    if (token !== '(?:' &&
                        token !== '(?=' &&
                        token !== '(?!' )
                    {
                        throw new Error('Ether MountMapper: Capturing groups are not allowed in the regex of a parameter value. Breadcrumb given was ' + crumb);
                    }
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
        let conflictingParams = [];
        let parentParams = parentData.params.reduce((memo, p) => memo[p] = true && memo, {});
        let totalParams = mountParams.slice();
        let expectedParams;

        if (mount instanceof Modified) {
            expectedParams = mount.klass.prototype.expectedParams();
        } else {
            expectedParams = mount.prototype.expectedParams();
        }

        for (let mountParam of mountParams) {
            if (parentParams[mountParam]) {
                conflictingParams.push(mountParam);
            }
        }

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

        for (let expectedParam of expectedParams) {
            if (parentParams[expectedParam]) {
                totalParams.push(expectedParam);
            }
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

    _instantiateMountInstance(mount, crumb, mountParams, parentData) {
        this._checkMountInheritance(mount, crumb, parentData.parentApp);

        let opts = {
            rootApp: parentData.rootApp,
            addresses: this._compileMountAddresses(mount),
            outlets: this._compileMountOutlets(mount, crumb, parentData),
            setup: this._compileMountSetupFns(mount),
            params: this._compileMountParams(mount, crumb, mountParams, parentData),
        };

        // add outlet names we are passing to our list of already-passed outlets
        // throw if multiple mounts are passed the same outlet
        this._addToPassedOutletsList(opts.outlets, parentData.parentApp);

        return {
            addresses: opts.addresses,
            instance: mount.create(opts),
        };
    }

    add(crumb, mount, parentData) {
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

        let parseResult = this.parse(crumb);
        let paramNames = parseResult.paramNames || [];
        let instantiationResult = this._instantiateMountInstance(mount, crumb, paramNames, parentData);
        let crumbData = {
            mount: instantiationResult.instance,
            addresses: instantiationResult.addresses,
            regex: parseResult.regex,
            paramNames: parseResult.paramNames,
            slashes: parseResult.slashes,
        };
        this._sortedCrumbs.push(crumbData);
        mergesort(this._sortedCrumbs, this._sortFn);
        this._crumbMap[crumb] = crumbData;
    }

    match(path) {
        let crumb;
        let theMatch;

        for (crumb of this._sortedCrumbs) {
            theMatch = crumb.regex.exec(path);
            if (theMatch) {
                break;
            }
        }

        if (!theMatch) {
            return null;
        }

        let len = theMatch.length;
        let paramNames = crumb.paramNames;
        let namesLen = paramNames ? paramNames.length : 0;

        if (len-namesLen > 2) {
            // somehow we have more params than expected,
            // even though we took match's first array val
            // and the captured value of the "rest of path" into account
            throw new Error('Ether MountMapper: The number of parameters in the given path exceeded the amount given in the breadcrumb. This is likely a bug. Path was "' + path + '" and regex was ' + crumb.regex.source);
        }

        let ret = {params:{}};
        for (let i = 0; i < namesLen; ++i) {
            let group = theMatch[i+1];
            if (isNumeric(group)) {
                group = +group;
            }
            ret.params[paramNames[i]] = group;
        }
        // turn the empty string into null
        ret.rest = theMatch[len-1] || null;
        return ret;
    }

    allAddresses() {
        return this._sortedCrumbs.reduce((memo, crumbData) => {
            crumbData.addresses.forEach(address => memo.push(address));
            return memo;
        }, []).sort();
    }

    addressesFor(crumb) {
        let mapped = this._crumbMap[crumb];
        if (mapped) {
            return mapped.addresses || [];
        }
        // return undefined if crumb didn't exist
        return;
    }

    allOutlets() {
        return Object.keys(this._outlets).sort();
    }

    regexFor(crumb) {
        let mapped = this._crumbMap[crumb];
        return mapped && mapped.regex;
    }

    paramNamesFor(crumb) {
        let mapped = this._crumbMap[crumb];
        if (mapped) {
            return mapped.paramNames || [];
        }
        // return undefined if crumb didn't exist
        return;
    }

    slashesFor(crumb) {
        let mapped = this._crumbMap[crumb];
        return mapped && mapped.slashes;
    }
}

export default MountMapper;
