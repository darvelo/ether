import Modifiable from './modifiable';
import ctorName from '../utils/ctor-name';
import { isnt } from '../utils/is';

class Route extends Modifiable {
    constructor(opts) {
        super(opts);
        this._rootApp = opts.rootApp;
        this._registerAddresses(opts.addresses);
        this.outlets = opts.outlets;
        this._events = {};
        this.init(opts.setup);
    }

    _registerAddresses(addresses) {
        addresses.forEach(name => this._rootApp._registerAddress(name, this));
    }

    // receives setup result if the .setup() modifier
    // was used to create this instance
    init(setup) { }

    DOMListen(element, evtName, callback, context) {
        if (!(element instanceof Element)) {
            throw new TypeError(ctorName(this) + '#DOMListen() was not passed an Element instance.');
        }
        if (isnt(callback, 'Function')) {
            throw new TypeError(ctorName(this) + '#DOMListen() was not passed a callback that was a function type.');
        }

        let elementsList = this._events[evtName] || (this._events[evtName] = []);
        let elementEvents = elementsList.find(elementEvents => {
            let [ elementWithEvents ] = elementEvents;
            return element === elementWithEvents;
        });

        if (!elementEvents) {
            elementEvents = [element, []];
            elementsList.push(elementEvents);
        }

        let [ , callbackList ] = elementEvents;
        let exists = callbackList.some(obj => obj.callback === callback && obj.context === context);

        if (!exists) {
            let obj = {
                callback,
                context,
                boundCallback: callback.bind(context),
            };
            callbackList.push(obj);
            element.addEventListener(evtName, obj.boundCallback, false);
        }
    }
    DOMUnlisten(element, evtName, callback, context) {
        if (!(element instanceof Element)) {
            throw new TypeError(ctorName(this) + '#DOMUnlisten() was not passed an Element instance.');
        }

        let elementsList = this._events[evtName] || (this._events[evtName] = []);
        let elementEventsIdx = elementsList.findIndex(elementEvents => {
            let [ elementWithEvents ] = elementEvents;
            return element === elementWithEvents;
        });

        if (elementEventsIdx === -1) {
            return;
        }

        let elementEvents = elementsList[elementEventsIdx];
        let [ , callbackList ] = elementEvents;

        if (!callback) {
            callbackList.forEach(obj => element.removeEventListener(evtName, obj.boundCallback, false));
            callbackList.length = 0;
        } else {
            let callbackIdx = callbackList.findIndex(obj => obj.callback === callback && obj.context === context);
            if (callbackIdx !== -1) {
                element.removeEventListener(evtName, callbackList[callbackIdx].boundCallback, false);
                callbackList.splice(callbackIdx, 1);
            }
        }

        // don't hold onto elements for longer than we need to
        if (callbackList.length === 0) {
            elementsList.splice(elementEventsIdx, 1);
        }
    }

    // user-overridable methods

    expectedAddresses() {
        return [];
    }

    addressesHandlers() {
        return [];
    }

    expectedParams() {
        return [];
    }

    expectedSetup(setup) {
        // user can throw if `setup` is not as expected
        return;
    }

    render() { }
    destroy() { }
    willHide() { }
    willShow() { }
}

export default Route;
