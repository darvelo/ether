import RootApp from '../../../../src/classes/root-app';
import Outlet from '../../../../src/classes/outlet';

import {
    mountSpies,
    cMountSpies,
} from '../sinon-spies';

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
class MyRootApp extends RootApp {
    createOutlets(outlets) {
        return {
            // mounts
            RootRootRoute: new Outlet(document.createElement('div')),
            RootNewsRoute: new Outlet(document.createElement('div')),
            TodoApp: new Outlet(document.createElement('div')),
            UserApp: new Outlet(document.createElement('div')),
            // conditional mounts
            RootAllConditionalRoute: new Outlet(document.createElement('div')),
            RootNewsConditionalRoute: new Outlet(document.createElement('div')),
            RootIdConditionalRouteOne: new Outlet(document.createElement('div')),
            RootIdConditionalRouteTwo: new Outlet(document.createElement('div')),
            RootConditionalRoute: new Outlet(document.createElement('div')),
        };
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
                    .outlets('TodoApp'),
            'user/{id=\\d+}':
                UserApp
                    .addresses('userApp')
                    .outlets('UserApp'),
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

export default MyRootApp;
