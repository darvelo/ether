import { Route } from 'ether';

class AlternateRoute extends Route {
    expectedOutlets() {
        return ['alternate'];
    }
    init() {
        let h1 = document.createElement('h1');
        h1.id = 'alternate-route-title';
        h1.textContent = 'AlternateRoute';
        this.outlets.alternate.appendChild(h1);
    }
}

export default AlternateRoute;
