class URLMapper {
    constructor() {
        this._urlMap = {};
    }

    add(path) {
        const NORMAL_MODE = 1;
        const PARAM_NAME_MODE = 2;
        const PARAM_VALUE_MODE = 3;

        let mode = NORMAL_MODE;
        let len = path.length;
        let finalRegex = [];
        // holds user-supplied properties encoded within regex string pattern
        let paramNames = [];
        // keeps track of string position when we need to push a slice of it
        // into the RegExp, to avoid `+=` string concat performance penalty
        let leftBound = 0;
        // the current position (index) while processing the string
        let cursor = 0;
        // used to test for malformed string pattern
        let bracesCount = 0;
        // will be stored in final urlmap data structure.
        // useful for sorting mapped urls by "path length"
        // to test longer paths (those with more slashes) first
        let slashesCount = 0;
        // when storing user-supplied properties encoded within a regex, we
        // need to make sure the prop name will be valid for an object literal
        let validPropRegex = /^[a-zA-Z][\w-]+$/;
        // since we're going to compile a RegExp,
        // we need to properly escape certain chars
        let escapes = {
            '/': '\\/',
            '\\': '\\\\',
        };

        finalRegex.push('^');

        while (cursor < len) {
            let c = path[cursor];
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
                    finalRegex.push(path.slice(leftBound, cursor));
                    leftBound = cursor+1;
                }
                if (escape) {
                    finalRegex.push(escapes[c]);
                }
            } else if (mode === PARAM_NAME_MODE) {
                if (c === '=') {
                    mode = PARAM_VALUE_MODE;
                    let name = path.slice(leftBound, cursor);
                    if (!validPropRegex.test(name)) {
                        throw new Error('Ether URLMapper: The parameter name "' + name + '" needs to be a string that can be used as a key in an object. Path was ' + path);
                    }
                    paramNames.push(name);
                    finalRegex.push('(');
                    leftBound = cursor+1;
                } else if (c === '{') {
                    throw new Error('Ether URLMapper: Got unexpected character "{" while parsing a parameter name in path ' + path);
                } else if (c === '}') {
                    throw new Error('Ether URLMapper: Got unexpected character "}" while parsing a parameter name in path ' + path);
                }
            } else if (mode === PARAM_VALUE_MODE) {
                if (c === '/') {
                    throw new Error('Ether URLMapper: The "/" character is not allowed in the regex of a parameter value. Path given was ' + path);
                } else if (c === '{') {
                    bracesCount++;
                } else if (c === '}') {
                    if (bracesCount) {
                        bracesCount--;
                    } else {
                        mode = NORMAL_MODE;
                        finalRegex.push(path.slice(leftBound, cursor));
                        finalRegex.push(')');
                        leftBound = cursor+1;
                    }
                }
            }
            ++cursor;
        }

        if (mode !== NORMAL_MODE) {
            throw new Error('Ether URLMapper: Malformed path ' + path);
        }

        if (leftBound < cursor) {
            finalRegex.push(path.slice(leftBound, cursor));
        }

        // @TODO: remove $ since we need to capture the rest to pass it along
        finalRegex.push('$');
        this._urlMap[path] = {
            regex: new RegExp(finalRegex.join('')),
            slashes: slashesCount,
            params: paramNames.length ? paramNames : null,
        };
    }

    regexFor(path) {
        let mapped = this._urlMap[path];
        return mapped && mapped.regex;
    }

    paramsFor(path) {
        let mapped = this._urlMap[path];
        return mapped && mapped.params;
    }
}

export default URLMapper;
