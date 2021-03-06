/* ============================================================================
 * Ether: base-mount-mapper.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

import Modified from './modified';
import ctorName from '../utils/ctor-name';

class BaseMountMapper {
    _compileMountOutlets(mount, crumb, passedOutlets, parentData, isConditionalMapper=false) {
        let missingOutlets = [];
        let outlets = {};
        let conditionalStr = isConditionalMapper ? 'conditional ' : '';

        if (mount instanceof Modified &&
            // the OutletsReceivable modifier,
            // if the user invoked it, sets this array
            Array.isArray(mount.outlets))
        {
            mount.outlets.forEach(name => {
                let outlet = parentData.outlets[name];
                if (!outlet) {
                    missingOutlets.push(name);
                } else {
                    outlets[name] = outlet;
                }
            });
            if (missingOutlets.length) {
                let ctorname = ctorName(parentData.parentApp);
                throw new Error(`${ctorname} ${conditionalStr}mount "${crumb}" requested these outlets that ${ctorname} does not own: ${JSON.stringify(missingOutlets)}.`);
            }
        }

        // add outlet names we are passing to our list of already-passed outlets.
        // throw if any other mount/cMount was already passed any of them.
        this._addToPassedOutletsList(outlets, passedOutlets, parentData.parentApp);

        return outlets;
    }

    _addToPassedOutletsList(outletsToPass, passedOutlets, parentApp) {
        let alreadyPassedOutlets = [];
        for (let name in outletsToPass) {
            if (passedOutlets.hasOwnProperty(name)) {
                alreadyPassedOutlets.push(name);
            } else {
                passedOutlets[name] = true;
            }
        }
        if (alreadyPassedOutlets.length) {
            throw new Error([
                ctorName(parentApp),
                ' tried to send these outlets to more than one mount: ',
                JSON.stringify(alreadyPassedOutlets.sort()),
                '.',
            ].join(''));
        }
    }
}

export default BaseMountMapper;
