import ModifiableRoute from './modifiable-route';

class Route extends ModifiableRoute {
    constructor(opts) {
        super();
        this._events = {};
    }

    DOMListen(element, evtName, callback, context) {
        if (!(element instanceof Element)) {
            throw new TypeError(this.constructor.name + '#DOMListen() was not passed an Element instance.');
        }
        if (typeof callback !== 'function') {
            throw new TypeError(this.constructor.name + '#DOMListen() was not passed a callback that was a function type.');
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
            throw new TypeError(this.constructor.name + '#DOMUnlisten() was not passed an Element instance.');
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
    render() {

    }
    destroy() {

    }
    willHide() {

    }
    willShow() {

    }
}

export default Route;
