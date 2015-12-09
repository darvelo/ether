export default function is(obj, guess) {
    if ((guess === 'Undefined' || typeof guess === undefined) && typeof obj === 'undefined') {
        return true;
    }

    if ((guess === 'Null' || guess === null) && obj === null) {
        return true;
    }

    return ({}).toString.call(obj).slice(8, -1) === guess;
}

export function isnt(obj, guess) {
    return !is(obj, guess);
}
