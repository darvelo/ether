import { Route } from 'ether';

class LinkRoute extends Route {
    expectedOutlets() {
        return ['link'];
    }
    init() {
        let paragraph = document.createElement('p');
        let basePath = '/base/';
        paragraph.innerHTML = `
            <h1 id="link-route-title">LinkRoute</h1>
            <a id="to-root" href="/">To root!</a>
            <a id="to-alternate" href="/alternate">To alternate!</a>

            <a id="to-basepath-root" href="${basePath}">To basePath root!</a>
            <a id="to-basepath-alternate" href="${basePath}alternate">To basePath alternate!</a>
        `;
        this.outlets.link.appendChild(paragraph);
    }
}

export default LinkRoute;
