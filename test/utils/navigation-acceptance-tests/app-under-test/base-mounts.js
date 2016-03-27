import RootApp from '../../../../src/classes/root-app';
import App from '../../../../src/classes/app';
import Route from '../../../../src/classes/route';
import ctorName from '../../../../src/utils/ctor-name';
import { isnt } from '../../../../src/utils/is';

export class TestApp extends App {
    expectedOutlets() {
        return [];
    }
}

export class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

export class SinonSpyRootApp extends RootApp {
    init(spies) {
        let ctorname = ctorName(this);
        if (isnt(spies, 'Object')) {
            throw new Error(`Sinon spies were not passed into ${ctorname}#init().`);
        }
        let mySpies = spies[ctorname];
        if (!mySpies) {
            throw new Error(`Sinon spies were not attached to ${ctorname}.`);
        }
        this.spies = mySpies;
    }
    prerender(params, queryParams, diff) {
        this.spies.prerenderSpy(params, queryParams, diff);
    }
    deactivate() {
        this.spies.deactivateSpy();
    }
    render(params, queryParams, diff) {
        this.spies.renderSpy(params, queryParams, diff);
    }
}

export class SinonSpyApp extends TestApp {
    init(spies) {
        let ctorname = ctorName(this);
        if (isnt(spies, 'Object')) {
            throw new Error(`Sinon spies were not passed into ${ctorname}#init().`);
        }
        let mySpies = spies[ctorname];
        if (!mySpies) {
            throw new Error(`Sinon spies were not attached to ${ctorname}.`);
        }
        this.spies = mySpies;
    }
    prerender(params, queryParams, diff) {
        this.spies.prerenderSpy(params, queryParams, diff);
    }
    deactivate() {
        this.spies.deactivateSpy();
    }
    render(params, queryParams, diff) {
        this.spies.renderSpy(params, queryParams, diff);
    }
}

export class SinonSpyRoute extends TestRoute {
    init(spies) {
        let ctorname = ctorName(this);
        if (isnt(spies, 'Object')) {
            throw new Error(`Sinon spies were not passed into ${ctorname}#init().`);
        }
        let mySpies = spies[ctorname];
        if (!mySpies) {
            throw new Error(`Sinon spies were not attached to ${ctorname}.`);
        }
        this.spies = mySpies;
    }
    prerender(params, queryParams, diff) {
        this.spies.prerenderSpy(params, queryParams, diff);
    }
    deactivate() {
        this.spies.deactivateSpy();
    }
    render(params, queryParams, diff) {
        this.spies.renderSpy(params, queryParams, diff);
    }
}

export class IdRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id'];
    }
}
