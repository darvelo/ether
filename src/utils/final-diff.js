/* ============================================================================
 * Ether: final-diff.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

import is from './is';

export default function finalDiff(paramsDiff, queryParamsDiff) {
    if (is(paramsDiff, 'Null') && is(queryParamsDiff, 'Null')) {
        return null;
    }
    return {
        params: paramsDiff,
        queryParams: queryParamsDiff,
    };
}
