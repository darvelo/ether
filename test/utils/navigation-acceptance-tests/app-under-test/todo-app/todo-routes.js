import {
    IdRoute,
    SinonSpyRoute,
} from '../base-mounts';

// mounts
export class TodoIdRenderStyleRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['todoIdRenderStyle'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    expectedOutlets() {
        return ['TodoIdRenderStyleRoute'];
    }
    expectedParams() {
        return ['id', 'renderStyle'];
    }
}

// conditional mounts
export class TodoIdConditionalRoute extends IdRoute {
    expectedOutlets() {
        return ['TodoIdConditionalRoute'];
    }
}
export class TodoIdRenderStyleConditionalRoute extends IdRoute {
    expectedOutlets() {
        return ['TodoIdRenderStyleConditionalRoute'];
    }
    expectedParams() {
        return ['id', 'renderStyle'];
    }
}
