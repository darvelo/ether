import { isnt } from './is';

function throwTypeErr(argNum, prop, val) {
    throw new TypeError(`diffObjects(): argument ${argNum} had a property "${prop}" that was not a number, string, or undefined: ${JSON.stringify(val)}.`);
}

export default function diffObjects(o1, o2) {
    if (isnt(o1, 'Object') || isnt(o2, 'Object')) {
        throw new TypeError('diffObjects(): was not passed two objects.');
    }

    // holds record of properties already
    // checked to avoid doing double work
    let checked = {};
    let hadDiffs = false;
    let result = {};

    for (let prop in o1) {
        if (o1.hasOwnProperty(prop)) {
            checked[prop] = true;
            let p1 = o1[prop];
            if (typeof p1 !== 'number' && typeof p1 !== 'string') {
                throwTypeErr(1, prop, p1);
            }
            let p2 = o2[prop];
            if (typeof p2 !== 'number' && typeof p2 !== 'string') {
                throwTypeErr(2, prop, p2);
            }
            if (p1 !== p2) {
                hadDiffs = true;
                result[prop] = [p1, p2];
            }
        }
    }
    for (let prop in o2) {
        if (!checked[prop] && o2.hasOwnProperty(prop)) {
            let p2 = o2[prop];
            if (typeof p2 !== 'number' && typeof p2 !== 'string') {
                throwTypeErr(2, prop, p2);
            }
            let p1 = o1[prop];
            if (typeof p1 !== 'number' && typeof p1 !== 'string') {
                throwTypeErr(1, prop, p1);
            }
            if (p1 !== p2) {
                hadDiffs = true;
                result[prop] = [p1, p2];
            }
        }
    }
    return hadDiffs ? result : null;
}
