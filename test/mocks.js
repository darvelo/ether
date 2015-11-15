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
}
