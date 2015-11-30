function isNumeric(str) {
    return !isNaN(str);
}

class URLMapper {
    constructor() {
        this._urlMap = {};
        this._sortedPatterns = [];
    }

    _sortFn(a, b) {
        // patterns with more slashes are are placed at the beginning
        return b.slashes - a.slashes;
    }

    add(patternStr, route) {
        const NORMAL_MODE = 1;
        const PARAM_NAME_MODE = 2;
        const PARAM_VALUE_MODE = 3;

        let mode = NORMAL_MODE;
        let len = patternStr.length;
        let finalRegex = [];
        // holds user-supplied properties encoded within pattern string
        let paramNames = [];
        // keeps track of string position when we need to push a slice of it
        // into the RegExp, to avoid `+=` string concat performance penalty
        let leftBound = 0;
        // the current position (index) while processing the string
        let cursor = 0;
        // used to test for malformed pattern string
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
        };

        finalRegex.push('^');

        while (cursor < len) {
            let c = patternStr[cursor];
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
                    finalRegex.push(patternStr.slice(leftBound, cursor));
                    leftBound = cursor+1;
                }
                if (escape) {
                    finalRegex.push(escapes[c]);
                }
            } else if (mode === PARAM_NAME_MODE) {
                if (c === '=') {
                    mode = PARAM_VALUE_MODE;
                    let name = patternStr.slice(leftBound, cursor);
                    paramNames.push(name);
                    finalRegex.push('(');
                    leftBound = cursor+1;
                } else if (c === '{') {
                    throw new Error('Ether URLMapper: Got unexpected character "{" while parsing a parameter name in pattern ' + patternStr);
                } else if (c === '}') {
                    throw new Error('Ether URLMapper: Got unexpected character "}" while parsing a parameter name in pattern ' + patternStr);
                }
            } else if (mode === PARAM_VALUE_MODE) {
                if (c === '/') {
                    throw new Error('Ether URLMapper: The "/" character is not allowed in the regex of a parameter value. Pattern given was ' + patternStr);
                } else if (c === '{') {
                    bracesCount++;
                } else if (c === '}') {
                    if (bracesCount) {
                        bracesCount--;
                    } else {
                        mode = NORMAL_MODE;
                        finalRegex.push(patternStr.slice(leftBound, cursor));
                        finalRegex.push(')');
                        leftBound = cursor+1;
                    }
                }
            }
            ++cursor;
        }

        if (mode !== NORMAL_MODE) {
            throw new Error('Ether URLMapper: Malformed pattern ' + patternStr);
        }

        if (leftBound < cursor) {
            finalRegex.push(patternStr.slice(leftBound, cursor));
        }

        // capture anything after the user-given pattern string.
        // any "extra" chars will be passed along to child Apps
        finalRegex.push('(.*)');

        let mapped = this._urlMap[patternStr] = {
            route: route,
            regex: new RegExp(finalRegex.join('')),
            slashes: slashesCount,
            paramNames: paramNames.length ? paramNames : null,
        };

        this._sortedPatterns.push(mapped);
        this._sortedPatterns.sort(this._sortFn);
    }

    match(path) {
        let pattern;
        let theMatch;

        for (pattern of this._sortedPatterns) {
            theMatch = pattern.regex.exec(path);
            if (theMatch) {
                break;
            }
        }

        if (!theMatch) {
            return null;
        }

        let len = theMatch.length;
        let paramNames = pattern.paramNames;
        let namesLen = paramNames.length;

        if (len-namesLen > 2) {
            // somehow we have more params than expected,
            // even though we took match's first array val
            // and the captured value of the "rest of path" into account
            throw new Error('Ether URLMapper: The number of parameters in the given path exceeded the amount given in the pattern. This is likely a bug. Path was "' + path + '" and regex was ' + pattern.regex.source);
        }

        let ret = {params:{}};
        for (let i = 0; i < namesLen; ++i) {
            let group = theMatch[i+1];
            if (isNumeric(group)) {
                group = +group;
            }
            ret.params[paramNames[i]] = group;
        }
        ret.rest = theMatch[len-1];
        ret.route = pattern.route;
        return ret;
    }

    regexFor(pattern) {
        let mapped = this._urlMap[pattern];
        return mapped && mapped.regex;
    }

    paramsFor(pattern) {
        let mapped = this._urlMap[pattern];
        return mapped && mapped.paramNames;
    }

    routeFor(pattern) {
        let mapped = this._urlMap[pattern];
        return mapped && mapped.route;
    }

    slashesFor(pattern) {
        let mapped = this._urlMap[pattern];
        return mapped && mapped.slashes;
    }
}

export default URLMapper;
