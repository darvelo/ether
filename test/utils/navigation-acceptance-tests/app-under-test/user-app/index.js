import {
    mountSpies,
    cMountSpies,
} from '../../sinon-spies';

import { TestApp } from '../base-mounts';

import {
    UserIdActionRoute,
    UserIdMenuRouteOne,
    UserIdMenuRouteTwo,
    UserIdConditionalRouteOne,
    UserIdConditionalRouteTwo,
    UserIdActionConditionalRoute,
    UserIdConditionalRouteThree,
    UserIdConditionalRouteFour,
    UserIdMenuConditionalRouteOne,
    UserIdMenuConditionalRouteTwo,
} from './user-routes';

class UserApp extends TestApp {
    expectedAddresses() {
        return ['userApp'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    mount() {
        return {
            'action/{action=\\w+}': UserIdActionRoute.addresses('userIdAction').setup(() => mountSpies),
            'menu/{menu=\\w+}': UserIdMenuRouteOne.addresses('userIdMenuOne').setup(() => mountSpies),
            'menu/{menu=\\w+}/profile': UserIdMenuRouteTwo.addresses('userIdMenuTwo').setup(() => mountSpies),
        };
    }
    mountConditionals() {
        return {
            '*': [UserIdConditionalRouteOne.setup(()  => cMountSpies)],
            // these two cMounts have the same logical result
            '+userIdAction': [
                UserIdConditionalRouteTwo.setup(()    => cMountSpies),
                UserIdActionConditionalRoute.setup(() => cMountSpies),
            ],
            '!userIdMenuOne,userIdMenuTwo': UserIdConditionalRouteThree.setup(() => cMountSpies),
            // these two cMounts have the same logical result
            '+userIdMenuOne,userIdMenuTwo': UserIdConditionalRouteFour.setup(() => cMountSpies),
            '!userIdAction': UserIdMenuConditionalRouteOne.setup(() => cMountSpies),
            // cMount just for "profile" route
            '+userIdMenuTwo': UserIdMenuConditionalRouteTwo.setup(() => cMountSpies),
        };
    }
}

export default UserApp;
