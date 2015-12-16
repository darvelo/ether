import App from './app';
import mergesort from '../utils/mergesort';
import ctorName from '../utils/ctor-name';
import { isnt } from '../utils/is';

function isNumeric(str) {
    return !isNaN(str);
}

class MountMapper {
    constructor() {
        this._crumbMap = {};
        this._sortedCrumbs = [];
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
        this._crumbMap[crumb] = parseResult;
        this._sortedCrumbs.push(parseResult);
        mergesort(this._sortedCrumbs, this._sortFn);
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
