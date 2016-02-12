import {
    IdRoute,
    SinonSpyRoute,
} from '../base-mounts';

// user base routes
export class IdActionRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'action'];
    }
}
export class IdMenuRoute extends SinonSpyRoute {
    expectedParams() {
        return ['id', 'menu'];
    }
}
export class UserIdMenuRouteOneAddress extends IdMenuRoute {
    addressesHandlers() {
        return [function(){}];
    }
}

// mounts
export class UserIdActionRoute extends IdActionRoute {
    expectedAddresses() {
        return ['userIdAction'];
    }
    addressesHandlers() {
        return [function(){}];
    }
}
export class UserIdMenuRouteOne extends UserIdMenuRouteOneAddress {
    expectedAddresses() {
        return ['userIdMenuOne'];
    }
}
export class UserIdMenuRouteTwo extends UserIdMenuRouteOneAddress {
    expectedAddresses() {
        return ['userIdMenuTwo'];
    }
}

// conditional mounts
export class UserIdConditionalRouteOne    extends  IdRoute { }
export class UserIdConditionalRouteTwo    extends  IdRoute { }
export class UserIdActionConditionalRoute extends  IdActionRoute { }
export class UserIdConditionalRouteThree   extends IdRoute { }
export class UserIdConditionalRouteFour    extends IdRoute { }
export class UserIdMenuConditionalRouteOne extends IdMenuRoute { }
export class UserIdMenuConditionalRouteTwo extends IdMenuRoute { }
