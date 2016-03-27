import Outlet from '../../../../../src/classes/outlet';

import {
    mountSpies,
    cMountSpies,
} from '../../sinon-spies';

import { SinonSpyApp } from '../base-mounts';

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

class UserApp extends SinonSpyApp {
    expectedAddresses() {
        return ['userApp'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    expectedOutlets() {
        return ['UserApp'];
    }
    expectedParams() {
        return ['id'];
    }
    createOutlets(outlets) {
        outlets.UserIdActionRoute = new Outlet(document.createElement('div'));
        outlets.UserIdMenuRouteOne = new Outlet(document.createElement('div'));
        outlets.UserIdMenuRouteTwo = new Outlet(document.createElement('div'));
        outlets.UserIdConditionalRouteOne = new Outlet(document.createElement('div'));
        outlets.UserIdConditionalRouteTwo = new Outlet(document.createElement('div'));
        outlets.UserIdActionConditionalRoute = new Outlet(document.createElement('div'));
        outlets.UserIdConditionalRouteThree = new Outlet(document.createElement('div'));
        outlets.UserIdConditionalRouteFour = new Outlet(document.createElement('div'));
        outlets.UserIdMenuConditionalRouteOne = new Outlet(document.createElement('div'));
        outlets.UserIdMenuConditionalRouteTwo = new Outlet(document.createElement('div'));
        return outlets;
    }
    mount() {
        return {
            'action/{action=\\w+}':
                UserIdActionRoute
                    .addresses('userIdAction')
                    .outlets('UserIdActionRoute')
                    .setup(() => mountSpies),
            'menu/{menu=\\w+}':
                UserIdMenuRouteOne
                    .addresses('userIdMenuOne')
                    .outlets('UserIdMenuRouteOne')
                    .setup(() => mountSpies),
            'menu/{menu=\\w+}/profile':
                UserIdMenuRouteTwo
                    .addresses('userIdMenuTwo')
                    .outlets('UserIdMenuRouteTwo')
                    .setup(() => mountSpies),
        };
    }
    mountConditionals() {
        return {
            '*': [
                UserIdConditionalRouteOne
                    .outlets('UserIdConditionalRouteOne')
                    .setup(()  => cMountSpies)],
            // these two cMounts have the same logical result
            '+userIdAction': [
                UserIdConditionalRouteTwo
                    .outlets('UserIdConditionalRouteTwo')
                    .setup(()    => cMountSpies),
                UserIdActionConditionalRoute
                    .outlets('UserIdActionConditionalRoute')
                    .setup(() => cMountSpies),
            ],
            '!userIdMenuOne,userIdMenuTwo':
                UserIdConditionalRouteThree
                    .outlets('UserIdConditionalRouteThree')
                    .setup(() => cMountSpies),
            // these two cMounts have the same logical result
            '+userIdMenuOne,userIdMenuTwo':
                UserIdConditionalRouteFour
                    .outlets('UserIdConditionalRouteFour')
                    .setup(() => cMountSpies),
            '!userIdAction':
                UserIdMenuConditionalRouteOne
                    .outlets('UserIdMenuConditionalRouteOne')
                    .setup(() => cMountSpies),
            // cMount just for "profile" route
            '+userIdMenuTwo':
                UserIdMenuConditionalRouteTwo
                    .outlets('UserIdMenuConditionalRouteTwo')
                    .setup(() => cMountSpies),
        };
    }
}

export default UserApp;
