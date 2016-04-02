import { Route } from 'ether';

class WindowLoadRoute extends Route {
    expectedOutlets() {
        return ['windowLoad'];
    }
    init() {
        let h1 = document.createElement('h1');
        h1.id = 'window-load-route-title';
        h1.textContent = 'WindowLoadRoute';
        this.outlets.windowLoad.appendChild(h1);
    }
}

export default WindowLoadRoute;
