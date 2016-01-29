import { isnt }from './is';

export default function isNumeric(str) {
    if (isnt(str, 'String')) {
        throw new TypeError('isNumeric expected a string and got: ' + str);
    }
    return !isNaN(str) && !/^\s*$/.test(str);
}

