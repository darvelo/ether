import { isnt } from './is';

function throwTypeErr(argNum, prop, val) {
    throw new TypeError(`diffObjects(): argument ${argNum} had a property "${prop}" that was not a number, string, or boolean: ${JSON.stringify(val)}.`);
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
            // don't specifically test for undefined since
            // if it hasOwn we assume that it's an actual value
            if (isnt(p1, 'Number') && isnt(p1, 'String') && isnt(p1, 'Boolean')) {
                throwTypeErr(1, prop, p1);
            }
            let p2 = o2[prop];
            // if `o2` doesn't hasOwn `prop` we
            // allow `undefined` as an acceptable value
            if (o2.hasOwnProperty(prop) && isnt(p2, 'Number') && isnt(p2, 'String') && isnt(p2, 'Boolean')) {
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
            // don't specifically test for undefined since
            // if it hasOwn we assume that it's an actual value
            if (isnt(p2, 'Number') && isnt(p2, 'String') && isnt(p2, 'Boolean')) {
                throwTypeErr(2, prop, p2);
            }
            let p1 = o1[prop];
            if (p1 !== p2) {
                hadDiffs = true;
                result[prop] = [p1, p2];
            }
        }
    }
    return hadDiffs ? result : null;
}
