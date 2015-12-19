import Modified from './modified';
import ctorName from '../utils/ctor-name';

class BaseMountMapper {
    _compileMountAddresses(mount) {
        let addresses = [];

        if (mount instanceof Modified &&
            // the Addressable modifier,
            // if the user invoked it, sets this array
            Array.isArray(mount.addresses))
        {
            mount.addresses.forEach(addr => addresses.push(addr));
        }

        return addresses;
    }

    _compileMountOutlets(mount, crumb, parentData, isConditionalMapper=false) {
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

        return outlets;
    }

    _compileMountSetupFns(mount) {
        let setupFns;

        if (mount instanceof Modified &&
            // the Setupable modifier,
            // if the user invoked it, sets this array
            Array.isArray(mount.setupFns))
        {
            setupFns = mount.setupFns.reduce((memo, fn) => fn(memo), undefined);
        }

        return setupFns;
    }

    _addToPassedOutletsList(outletsToPass, parentApp) {
        let alreadyPassedOutlets = [];
        let outlets = this._outlets;
        for (let name in outletsToPass) {
            if (outlets.hasOwnProperty(name) && outlets[name]) {
                alreadyPassedOutlets.push(name);
            } else {
                outlets[name] = true;
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
