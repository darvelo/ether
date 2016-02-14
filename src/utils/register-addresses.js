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
