import { Route } from 'ether';

class RootRoute extends Route {
    expectedOutlets() {
        return ['root'];
    }
    init() {
        let h1 = document.createElement('h1');
        h1.id = 'root-route-title';
        h1.textContent = 'RootRoute';
        this.outlets.root.appendChild(h1);
    }
}

export default RootRoute;
