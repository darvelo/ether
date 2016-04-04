/* ============================================================================
 * Ether: addressable.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

class Addressable {
    static transform(modified, ...names) {
        modified._argsTransformFns.push(args => {
            let opts = args[0];
            opts.addresses = names;
            return args;
        });
        return modified;
    }
}

export default Addressable;
