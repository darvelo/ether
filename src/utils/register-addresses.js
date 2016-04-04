/* ============================================================================
 * Ether: register-addresses.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

import is from './is';

export default function registerAddresses(target, addresses) {
    let handlers = target.addressesHandlers();
    target._addressHandlers = {};
    addresses.forEach((name, idx) => {
        target._rootApp._registerAddress(name, target);
        let handler = handlers[idx];
        if (is(handler, 'String')) {
            handler = target[handler];
        }
        target._addressHandlers[name] = handler;
    });
}
