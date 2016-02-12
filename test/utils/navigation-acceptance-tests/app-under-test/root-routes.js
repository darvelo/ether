import {
    IdRoute,
    SinonSpyRoute,
} from './base-mounts';

// mounts
export class RootRootRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['rootRoot'];
    }
    addressesHandlers() {
        return [function(){}];
    }
}

export class RootNewsRoute extends SinonSpyRoute { }

// conditional mounts
export class RootIdConditionalRouteOne extends IdRoute { }
export class RootIdConditionalRouteTwo extends IdRoute { }
export class RootAllConditionalRoute   extends SinonSpyRoute { }
export class RootConditionalRoute      extends SinonSpyRoute { }
export class RootNewsConditionalRoute  extends SinonSpyRoute {
    expectedParams() {
        return ['news'];
    }
}
