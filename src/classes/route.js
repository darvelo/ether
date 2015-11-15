import ModifiableRoute from './modifiable-route';

class Route extends ModifiableRoute {
    constructor(opts) {
        super();
        this._events = {};
    }

    DOMListen(element, evtName, callback) {
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        if (!evtList.some(pair => pair[0] === callback)) {
            let pair = [callback, callback.bind(this)];
            evtList.push(pair);
            element.addEventListener(evtName, pair[1], false);
        }
    }
    DOMUnlisten(element, evtName, callback) {
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        if (!callback) {
            evtList.forEach(pair => element.removeEventListener(evtName, pair[1]));
        } else {
            let idx = evtList.findIndex(pair => pair[0] === callback);
            if (idx !== -1) {
                element.removeEventListener(evtName, evtList[idx][1], false);
                evtList.splice(idx, 1);
            }
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
