import { is, isnt } from './is';

/*
 * This is a mixup of code from Mozilla Firefox, Babel, and my own code.
 */

var unbind = Function.call.bind(Function.bind, Function.call);
var reduce = Array.reduce || unbind(Array.prototype.reduce);
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var create = Object.create;
var getNames = x => [...Object.getOwnPropertyNames(x),
                     ...Object.getOwnPropertySymbols(x)];

// Utility function to get own properties descriptor map.
function getOwnPropertyDescriptors(object) {
    return reduce(getNames(object), function(descriptor, name) {
        descriptor[name] = getOwnPropertyDescriptor(object, name);
        return descriptor;
    }, {});
}

function babelInherits(subClass, superClass) {
    if (isnt(superClass, 'Function') && isnt(superClass, null)) {
        throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
    }
    subClass.prototype = create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    // inherit static props on the constructor
    // from the superClass constructor
    if (superClass) {
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(subClass, superClass);
        } else {
            subClass.__proto__ = superClass;
        }
    }
}

function inherits(subClass, superClass, protoProps, staticProps) {
    if (is(subClass, 'Null')) {
        subClass = function (...args) {
            superClass.apply(this, args);
        };
    }
    if (isnt(subClass, 'Function')) {
        throw new TypeError(`inherits(): subClass was not a function or null: ${JSON.stringify(subClass)}.`);
    }
    if (isnt(superClass, 'Function')) {
        throw new TypeError(`inherits(): superClass was not a function: ${JSON.stringify(superClass)}.`);
    }

    babelInherits(subClass, superClass);

    if (is(protoProps, 'Object')) {
        Object.defineProperties(subClass.prototype, getOwnPropertyDescriptors(protoProps));
    }
    if (is(staticProps, 'Object')) {
        Object.defineProperties(subClass, getOwnPropertyDescriptors(staticProps));
    }

    return subClass;
}

export default inherits;
