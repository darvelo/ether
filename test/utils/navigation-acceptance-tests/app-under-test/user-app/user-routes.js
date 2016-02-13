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
    expectedOutlets() {
        return ['UserIdActionRoute'];
    }
}
export class UserIdMenuRouteOne extends UserIdMenuRouteOneAddress {
    expectedAddresses() {
        return ['userIdMenuOne'];
    }
    expectedOutlets() {
        return ['UserIdMenuRouteOne'];
    }
}
export class UserIdMenuRouteTwo extends UserIdMenuRouteOneAddress {
    expectedAddresses() {
        return ['userIdMenuTwo'];
    }
    expectedOutlets() {
        return ['UserIdMenuRouteTwo'];
    }
}

// conditional mounts
export class UserIdConditionalRouteOne    extends  IdRoute {
    expectedOutlets() {
        return ['UserIdConditionalRouteOne'];
    }
}
export class UserIdConditionalRouteTwo    extends  IdRoute {
    expectedOutlets() {
        return ['UserIdConditionalRouteTwo'];
    }
}
export class UserIdActionConditionalRoute extends  IdActionRoute {
    expectedOutlets() {
        return ['UserIdActionConditionalRoute'];
    }
}
export class UserIdConditionalRouteThree   extends IdRoute {
    expectedOutlets() {
        return ['UserIdConditionalRouteThree'];
    }
}
export class UserIdConditionalRouteFour    extends IdRoute {
    expectedOutlets() {
        return ['UserIdConditionalRouteFour'];
    }
}
export class UserIdMenuConditionalRouteOne extends IdMenuRoute {
    expectedOutlets() {
        return ['UserIdMenuConditionalRouteOne'];
    }
}
export class UserIdMenuConditionalRouteTwo extends IdMenuRoute {
    expectedOutlets() {
        return ['UserIdMenuConditionalRouteTwo'];
    }
}
