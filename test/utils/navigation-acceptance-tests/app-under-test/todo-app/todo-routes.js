import {
    IdRoute,
    SinonSpyRoute,
} from '../base-mounts';

// mounts
export class TodoIdRenderStyleRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'renderStyle'];
    }
    expectedAddresses() {
        return ['todoIdRenderStyle'];
    }
    addressesHandlers() {
        return [function(){}];
    }
}

// conditional mounts
export class TodoIdConditionalRoute            extends IdRoute { }
export class TodoIdRenderStyleConditionalRoute extends IdRoute {
    expectedParams() {
        return ['id', 'renderStyle'];
    }
}
