// test regex equality
// see: http://stackoverflow.com/questions/10776600/testing-for-equality-of-regular-expressions
export default function regexEqual(r1, r2) {
    function throwUsefulError() {
        throw new Error(['RegExp ', r1.source, ' was not equal to ', r2.source].join(''));
    }

    if (!(r1 instanceof RegExp && r2 instanceof RegExp)) {
        throwUsefulError();
    }

    ['global', 'multiline', 'ignoreCase', 'source'].forEach(prop => {
        if (r1[prop] !== r2[prop]) {
            throwUsefulError();
        }
    });

    return true;
}

