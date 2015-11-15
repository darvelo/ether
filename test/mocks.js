export class Element {
    get parentNode() {
        if (!this._parentNode) {
            this._parentNode = new Element();
            this._parentNode.children = [this];
        }
        return this._parentNode;
    }
    appendChild(element) {
        this.children = this.children || [];
        this.children.push(element);
    }
    removeChild(element) {
        this.children = this.children || [];
        let idx = this.children.indexOf(element);
        if (idx !== -1) {
            return this.children.splice(idx, 1)[0];
        } else {
            throw new Error('child not found in Element');
        }
    }
    querySelector() { }
    querySelectorAll() { }
    fire(evtName) {
        this._events = this._events || {};
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        for (let callback of evtList) {
            callback();
        }
    }
    addEventListener(evtName, callback) {
        this._events = this._events || {};
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        if (!evtList.some(cb => cb === callback)) {
            evtList.push(callback);
        }
    }
    removeEventListener(evtName, callback) {
        this._events = this._events || {};
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        if (!callback) {
            evtList.length = 0;
        } else {
            let idx = evtList.indexOf(callback);
            if (idx !== -1) {
                evtList.splice(idx, 1);
            }
        }
    }
}
