import Outlet from '../../../../../src/classes/outlet';

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
    expectedOutlets() {
        return ['UserApp'];
    }
    createOutlets(outlets) {
        return {
            UserIdActionRoute: new Outlet(document.createElement('div')),
            UserIdMenuRouteOne: new Outlet(document.createElement('div')),
            UserIdMenuRouteTwo: new Outlet(document.createElement('div')),
            UserIdConditionalRouteOne: new Outlet(document.createElement('div')),
            UserIdConditionalRouteTwo: new Outlet(document.createElement('div')),
            UserIdActionConditionalRoute: new Outlet(document.createElement('div')),
            UserIdConditionalRouteThree: new Outlet(document.createElement('div')),
            UserIdConditionalRouteFour: new Outlet(document.createElement('div')),
            UserIdMenuConditionalRouteOne: new Outlet(document.createElement('div')),
            UserIdMenuConditionalRouteTwo: new Outlet(document.createElement('div')),
        };
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
