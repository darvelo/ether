class URLMapper {
    constructor() {
        this._patternMap = {};
    }

    add(strPattern) {
        let replaced = strPattern.replace(/\\/g, '\\\\').replace(/\//g, '\\/');
        let regex = new RegExp('^' + replaced + '$');
        this._patternMap[strPattern] = regex;
    }

    regexFor(strPattern) {
        return this._patternMap[strPattern];
    }
}

export default URLMapper;
