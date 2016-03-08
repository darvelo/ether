import { Route } from 'ether';

class LinkRoute extends Route {
    expectedOutlets() {
        return ['link'];
    }
    init() {
        let paragraph = document.createElement('p');
        paragraph.innerHTML = `
            <h1 id="link-route-title">LinkRoute</h1>
            <a href="/">To root!</a>
        `;
        this.outlets.link.append(paragraph);
    }
}

export default LinkRoute;
