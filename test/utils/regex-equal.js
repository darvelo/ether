// test regex equality
// see: http://stackoverflow.com/questions/10776600/testing-for-equality-of-regular-expressions
export default function regexEqual(r1, r2) {
    if (!(r1 instanceof RegExp)) {
        throw new Error('regexEqual: r1 was not a RegExp instance.');
    }
    if (!(r2 instanceof RegExp)) {
        throw new Error('regexEqual: r2 was not a RegExp instance.');
    }

    ['global', 'multiline', 'ignoreCase', 'source'].forEach(prop => {
        if (r1[prop] !== r2[prop]) {
            throw new Error(`regexEqual: r1.${prop} !== r2.${prop}. r1.${prop}: "${r1[prop]}". r2.${prop}: "${r2[prop]}".`);
        }
    });

    return true;
}

