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
    expectedOutlets() {
        return ['RootRootRoute'];
    }
}

export class RootNewsRoute extends SinonSpyRoute {
    expectedOutlets() {
        return ['RootNewsRoute'];
    }
}

// conditional mounts
export class RootAllConditionalRoute   extends SinonSpyRoute {
    expectedOutlets() {
        return ['RootAllConditionalRoute'];
    }
}
export class RootNewsConditionalRoute  extends SinonSpyRoute {
    expectedOutlets() {
        return ['RootNewsConditionalRoute'];
    }
    expectedParams() {
        return ['news'];
    }
}
export class RootIdConditionalRouteOne extends IdRoute {
    expectedOutlets() {
        return ['RootIdConditionalRouteOne'];
    }
}
export class RootIdConditionalRouteTwo extends IdRoute {
    expectedOutlets() {
        return ['RootIdConditionalRouteTwo'];
    }
}
export class RootConditionalRoute      extends SinonSpyRoute {
    expectedOutlets() {
        return ['RootConditionalRoute'];
    }
}
