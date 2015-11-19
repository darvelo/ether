class URLMapper {
    constructor() {
        this._urlMap = {};
    }

    add(strPattern) {
        let len = strPattern.length;
        let paramNames = [];
        let finalRegex = [];
        let bound = 0;
        let cursor = 0;
        let bracesCount = 0;
        let slashesCount = 0;
        let validPropRegex = /^[a-zA-Z][\w\d_-]+$/;

        const GATHERMODE = {
            normal: 1,
            paramName: 2,
            paramValue: 3,
        };

        let replaceChar = {
            '/': '\\/',
            '\\': '\\\\',
        };


        let mode = GATHERMODE.normal;

        finalRegex.push('^');

        while (cursor < len) {
            let c = strPattern[cursor];
            if (mode === GATHERMODE.normal) {
                let pushSlice = false;
                let replace   = false;
                let moveBound = false;

                if (c === '{') {
                    mode = GATHERMODE.paramName;
                    pushSlice = true;
                    moveBound = true;
                } else if (replaceChar[c]) {
                    if (c === '/') {
                        slashesCount++;
                    }
                    pushSlice = true;
                    replace = true;
                    moveBound = true;
                }

                if (pushSlice) {
                    finalRegex.push(strPattern.slice(bound, cursor));
                }
                if (replace) {
                    finalRegex.push(replaceChar[c]);
                }
                if (moveBound) {
                    bound = cursor+1;
                }
            } else if (mode === GATHERMODE.paramName) {
                if (c === '=') {
                    mode = GATHERMODE.paramValue;
                    let name = strPattern.slice(bound, cursor);
                    if (!validPropRegex.test(name)) {
                        throw new Error('The parameter name "' + name + '" needs to be a string that can be used as a key in an object.');
                    }
                    paramNames.push(name);
                    finalRegex.push('(');
                    bound = cursor+1;
                } else if (c === '{') {
                    throw new Error('Got unexpected character "{" while parsing a parameter name in ' + strPattern);
                } else if (c === '}') {
                    throw new Error('Got unexpected character "}" while parsing a parameter name in ' + strPattern);
                }
            } else if (mode === GATHERMODE.paramValue) {
                if (c === '/') {
                    throw new Error('The "/" character is not allowed in the regex value of a parameter name.');
                } else if (c === '{') {
                    bracesCount++;
                } else if (c === '}') {
                    if (bracesCount) {
                        bracesCount--;
                    } else {
                        mode = GATHERMODE.normal;
                        finalRegex.push(strPattern.slice(bound, cursor));
                        finalRegex.push(')');
                        bound = cursor+1;
                    }
                }
            }
            ++cursor;
        }

        if (mode !== GATHERMODE.normal) {
            throw new Error('URL Regex was malformed in ' + strPattern);
        }

        if (bound < cursor) {
            finalRegex.push(strPattern.slice(bound, cursor));
        }

        // @TODO: remove $ since we need to capture the rest to pass it along
        finalRegex.push('$');
        finalRegex = new RegExp(finalRegex.join(''));
        this._urlMap[strPattern] = {
            regex: finalRegex,
            slashes: slashesCount,
            params: paramNames.length ? paramNames : null,
        };
    }

    regexFor(strPattern) {
        let mapped = this._urlMap[strPattern];
        return mapped && mapped.regex;
    }

    paramsFor(strPattern) {
        let mapped = this._urlMap[strPattern];
        return mapped && mapped.params;
    }
}

export default URLMapper;
