/* ============================================================================
 * Ether: outlets-receivable.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

class OutletsReceivable {
    static transform(modified, ...names) {
        modified.outlets = names;
    }
}

export default OutletsReceivable;
