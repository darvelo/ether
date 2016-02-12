import RootApp from '../../../../src/classes/root-app';

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

import TodoApp from './todo-app/todo-app';
import UserApp from './user-app/user-app';

// need to make sure to mount each mount class and
// each conditional mount class exactly once,
// to ensure spy call counts are unique and correct
class MyRootApp extends RootApp {
    mount() {
        return {
            '': RootRootRoute.addresses('rootRoot').setup(() => mountSpies),
            'news/{news=\\w+}': RootNewsRoute.setup(() => mountSpies),
            'todos/{id=\\d+}': TodoApp.addresses('todoApp'),
            'user/{id=\\d+}': UserApp.addresses('userApp'),
        };
    }
    mountConditionals() {
        return {
            '*': RootAllConditionalRoute.setup(() => cMountSpies),
            '!todoApp,userApp,rootRoot': RootNewsConditionalRoute.setup(() => cMountSpies),
            '+userApp': [
                RootIdConditionalRouteOne.setup(() => cMountSpies),
                RootIdConditionalRouteTwo.setup(() => cMountSpies),
            ],
            '+rootRoot': RootConditionalRoute.setup(() => cMountSpies),
        };
    }
}

export default MyRootApp;
