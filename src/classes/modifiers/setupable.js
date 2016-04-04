/* ============================================================================
 * Ether: setupable.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

class Setupable {
    static transform(modified, ...setupFns) {
        modified._argsTransformFns.push(args => {
            let opts = args[0];
            opts.setup = setupFns.reduce((memo, fn) => fn(memo), undefined);
            return args;
        });
        return modified;
    }
}

export default Setupable;
