import RootApp from '../../../src/classes/root-app';
import App from '../../../src/classes/app';
import Route from '../../../src/classes/route';
import MutableOutlet from '../../../src/classes/mutable-outlet';

export let routeAddress            = 'myroute';
export let rootRouteAddress        = 'rootroute';
export let anythingRouteAddress    = 'anythingroute';
export let conditionalRouteAddress = 'myconditionalroute';
export let appAddress              = 'myapp';
export let rootAppAddress          = 'myrootapp';

class TestRoute extends Route {
    addressesHandlers() {
        return [function(){}];
    }
    expectedOutlets() {
        return [];
    }
}

export class MyRoute extends TestRoute {
    expectedAddresses() {
        return [routeAddress];
    }
}

export class RootRoute extends TestRoute {
    expectedAddresses() {
        return [rootRouteAddress];
    }
}

export class AnythingRoute extends TestRoute {
    expectedAddresses() {
        return [anythingRouteAddress];
    }
}

export class MyConditionalRoute extends TestRoute {
    expectedAddresses() {
        return [conditionalRouteAddress];
    }
}

export class MyApp extends App {
    expectedAddresses() {
        return [appAddress];
    }
    addressesHandlers() {
        return [function(){}];
    }
    expectedOutlets() {
        return [];
    }
    mount() {
        return {
            'hello/{name=\\w+}123/{action=\\w+}': MyRoute.addresses(routeAddress),
        };
    }
    mountConditionals() {
        return {
            '*': MyConditionalRoute.addresses(conditionalRouteAddress),
        };
    }
}

export class MyRootApp extends RootApp {
    expectedAddresses() {
        return [rootAppAddress];
    }
    addressesHandlers() {
        return [function(){}];
    }
    expectedOutlets() {
        return [];
    }
    mount() {
        return {
            '': RootRoute.addresses(rootRouteAddress),
            'a{id=\\d+}b/c{name=[^\\/]+}d/e{action=[^\\/]+}f': AnythingRoute.addresses(anythingRouteAddress),
            'abc/{id=\\d+}xyz': MyApp.addresses(appAddress),
        };
    }
}
