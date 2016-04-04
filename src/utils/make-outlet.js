/* ============================================================================
 * Ether: make-outlet.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

import Outlet from '../classes/outlet';
import MutableOutlet from '../classes/mutable-outlet';
import { is, isnt } from './is';

function makeOutlet(opts) {
    let el, outlet;

    if (isnt(opts, 'Object')) {
        throw new TypeError('makeOutlet(): Did not receive an object.');
    }
    if (is(opts.el, 'Undefined') && is(opts.tagName, 'Undefined')) {
        throw new Error('makeOutlet(): Needs to receive an object with either of these two properties: el, or tagName.');
    }
    if (isnt(opts.el, 'Undefined') && isnt(opts.tagName, 'Undefined')) {
        throw new Error('makeOutlet(): Needs to receive an object with either of these two properties, but the object had both: el, or tagName.');
    }

    if (isnt(opts.el, 'Undefined')) {
        if (!(opts.el instanceof Element)) {
            throw new TypeError('makeOutlet(): Property `el` was not an instance of Element.');
        } else{
            el = opts.el;
        }
    }

    if (isnt(opts.tagName, 'Undefined')) {
        if (isnt(opts.tagName, 'String')) {
            throw new TypeError('makeOutlet(): Property `tagName` was not a string.');
        } else {
            el = document.createElement(opts.tagName);
        }
    }

    if (is(opts.classNames, 'Array')) {
        el.classList.add(...opts.classNames);
    }

    if (opts.mutable === true) {
        outlet = new MutableOutlet(el);
    } else {
        outlet = new Outlet(el);
    }

    if (isnt(opts.append, 'Undefined')) {
        if (isnt(opts.append, 'Array')) {
            opts.append = [opts.append];
        }

        opts.append.forEach(val => {
            if (val instanceof Element) {
                el.appendChild(val);
            } else if (val instanceof Outlet) {
                if (!(val._element instanceof Element)) {
                    throw new Error('makeOutlet(): Tried to append an Outlet that was not holding HTML Element.');
                } else {
                    el.appendChild(val._element);
                }
            } else {
                throw new TypeError('makeOutlet(): Tried to append a value to the outlet\'s element that was neither an Outlet nor another HTML Element.');
            }
        });
    }

    return outlet;
}

export default makeOutlet;
