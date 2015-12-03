export class Eventable {
    fire(evtName) {
        this._events = this._events || {};
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        for (let callback of evtList) {
            callback();
        }
    }
    addEventListener(evtName, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Element#addEventListener() was not passed a callback function.');
        }
        this._events = this._events || {};
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        if (!evtList.some(cb => cb === callback)) {
            evtList.push(callback);
        }
    }
    removeEventListener(evtName, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Element#removeEventListener() was not passed a callback function.');
        }
        this._events = this._events || {};
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        let idx = evtList.indexOf(callback);
        if (idx !== -1) {
            evtList.splice(idx, 1);
        }
    }
}

export var window = {
    __proto__: Eventable,
};

export var document = {
    __proto__: Eventable,

    createElement() {
        return new Element();
    },

    querySelector() {
        throw new Error('document.querySelector() not implemented.');
    }
};

export class Element extends Eventable {
    get children() {
        return this._children || (this._children = []);
    }
    set children(array) {
        this._children = array;
    }
    get innerHTML() {
        if (!this.children.length) {
            return '';
        }
        throw new Error('Element#innerHTML not implemented for when element has children.');
    }
    set innerHTML(value) {
        if (value === '' && this.children) {
            this.children.length = 0;
        }
    }
    get parentNode() {
        if (!this._parentNode) {
            this._parentNode = new Element();
            this._parentNode.children = [this];
        }
        return this._parentNode;
    }
    appendChild(element) {
        if (!(element instanceof Element)) {
            throw new TypeError('Element#appendChild() was not passed an Element instance.');
        }
        this.children.push(element);
    }
    removeChild(element) {
        if (!(element instanceof Element)) {
            throw new TypeError('Element#removeChild() was not passed an Element instance.');
        }
        let idx = this.children.indexOf(element);
        if (idx !== -1) {
            return this.children.splice(idx, 1)[0];
        } else {
            throw new Error('Element#removeChild(): child not found in element.');
        }
    }
    querySelector() { }
    querySelectorAll() { }
}
