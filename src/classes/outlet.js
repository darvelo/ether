class Outlet {
    constructor(element) {
        if (!(element instanceof Element)) {
            throw new Error('Ether.Outlet was not given an element in its constructor.');
        }
    }

    clear(owner) {

    }
}

export default Outlet;
