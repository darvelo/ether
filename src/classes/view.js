/* ============================================================================
 * Ether: view.js v1.0.0
 * http://etherjs.com/
 * ============================================================================
 * Copyright 2015-2016 David Arvelo
 * Licensed under MIT (https://github.com/darvelo/ether/blob/master/LICENSE.md)
 * ============================================================================ */

import ctorName from '../utils/ctor-name';
import { is, isnt } from '../utils/is';

class View {
    constructor(...args) {
        this._events = {};
        this.init(...args);
    }

    init() { }

    DOMListen(element, evtName, callback, context) {
        if (is(callback, 'String')) {
            callback = this[callback];
            context  = this;
        }
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
        if (is(callback, 'String')) {
            callback = this[callback];
            context  = this;
        }
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
}

export default View;
