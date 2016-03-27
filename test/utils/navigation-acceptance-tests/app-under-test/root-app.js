import Outlet from '../../../../src/classes/outlet';

import {
    mountSpies,
    cMountSpies,
} from '../sinon-spies';

import { SinonSpyRootApp } from './base-mounts';

import {
    RootRootRoute,
    RootNewsRoute,
    RootAllConditionalRoute,
    RootNewsConditionalRoute,
    RootIdConditionalRouteOne,
    RootIdConditionalRouteTwo,
    RootConditionalRoute,
} from './root-routes';

import TodoApp from './todo-app/';
import UserApp from './user-app/';

// need to make sure to mount each mount class and
// each conditional mount class exactly once,
// to ensure spy call counts are unique and correct
class MyRootApp extends SinonSpyRootApp {
    createOutlets(outlets) {
        // mounts
        outlets.RootRootRoute = new Outlet(document.createElement('div'));
        outlets.RootNewsRoute = new Outlet(document.createElement('div'));
        outlets.TodoApp = new Outlet(document.createElement('div'));
        outlets.UserApp = new Outlet(document.createElement('div'));
        // conditional mounts
        outlets.RootAllConditionalRoute = new Outlet(document.createElement('div'));
        outlets.RootNewsConditionalRoute = new Outlet(document.createElement('div'));
        outlets.RootIdConditionalRouteOne = new Outlet(document.createElement('div'));
        outlets.RootIdConditionalRouteTwo = new Outlet(document.createElement('div'));
        outlets.RootConditionalRoute = new Outlet(document.createElement('div'));
        return outlets;
    }
    mount() {
        return {
            '':
                RootRootRoute
                    .addresses('rootRoot')
                    .outlets('RootRootRoute')
                    .setup(() => mountSpies),
            'news/{news=\\w+}':
                RootNewsRoute
                    .outlets('RootNewsRoute')
                    .setup(() => mountSpies),
            'todos/{id=\\d+}':
                TodoApp
                    .addresses('todoApp')
                    .outlets('TodoApp')
                    .setup(() => mountSpies),
            'user/{id=\\d+}':
                UserApp
                    .addresses('userApp')
                    .outlets('UserApp')
                    .setup(() => mountSpies),
        };
    }
    mountConditionals() {
        return {
            '*':
                RootAllConditionalRoute
                    .outlets('RootAllConditionalRoute')
                    .setup(() => cMountSpies),
            '!todoApp,userApp,rootRoot':
                RootNewsConditionalRoute
                    .outlets('RootNewsConditionalRoute')
                    .setup(() => cMountSpies),
            '+userApp': [
                RootIdConditionalRouteOne
                    .outlets('RootIdConditionalRouteOne')
                    .setup(() => cMountSpies),
                RootIdConditionalRouteTwo
                    .outlets('RootIdConditionalRouteTwo')
                    .setup(() => cMountSpies),
            ],
            '+rootRoot':
                RootConditionalRoute
                    .outlets('RootConditionalRoute')
                    .setup(() => cMountSpies),
        };
    }
}

export default MyRootApp.setup(() => mountSpies);
