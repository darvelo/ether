import { isnt } from '../src/utils/is';

export class Eventable {
    fire(evtName) {
        this._events = this._events || {};
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        for (let callback of evtList) {
            callback();
        }
    }
    addEventListener(evtName, callback) {
        if (isnt(callback, 'Function')) {
            throw new Error('Element#addEventListener() was not passed a callback function.');
        }
        this._events = this._events || {};
        let evtList = this._events[evtName] || (this._events[evtName] = []);
        if (!evtList.some(cb => cb === callback)) {
            evtList.push(callback);
        }
    }
    removeEventListener(evtName, callback) {
        if (isnt(callback, 'Function')) {
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
    EtherTestEnvironment: true,
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

class ClassList {
    constructor() {
        this._classes = [];
    }
    contains(className) {
        return this._classes.some(name => name === className);
    }
    add(...classNames) {
        for (let className of classNames) {
            if (!this.contains(className)) {
                this._classes.push(className);
            }
        }
    }
    remove(...classNames) {
        for (let className of classNames) {
            let idx = this._classes.indexOf(className);
            if (idx !== -1) {
                this._classes.splice(idx, 1);
            }
        }
    }
}

export class Element extends Eventable {
    constructor(...args) {
        super(...args);
        this._innerHTML = '';
    }
    click() {
        this.fire('click');
    }
    get classList() {
        return this._classList || (this._classList = new ClassList());
    }
    get className() {
        return this.classList._classes.join(' ');
    }
    get children() {
        return this._children || (this._children = []);
    }
    set children(array) {
        this._children = array;
    }
    get innerHTML() {
        if (this._children && this._children.length) {
            throw new Error('Element#innerHTML get not implemented for when element has children.');
        }
        return this._innerHTML;
    }
    set innerHTML(value) {
        if (this._children) {
            if (value === '') {
                this.children.length = 0;
            } else {
                throw new Error('Element#innerHTML set not implemented for when element has children and the string is not empty.');
            }
        }
        this._innerHTML = value;
    }
    get parentNode() {
        if (!this._parentNode) {
            this._parentNode = new Element();
            this._parentNode.children = [this];
        }
        return this._parentNode;
    }
    set parentNode(element) {
        this._parentNode = element;
    }
    appendChild(element) {
        if (!(element instanceof Element)) {
            throw new TypeError('Element#appendChild() was not passed an Element instance.');
        }
        this.children.push(element);
        element.parentNode = this;
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
