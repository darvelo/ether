import Outlet from '../../../../../src/classes/outlet';

import {
    mountSpies,
    cMountSpies,
} from '../../sinon-spies';

import { TestApp } from '../base-mounts';

import {
    TodoIdRenderStyleRoute,
    TodoIdConditionalRoute,
    TodoIdRenderStyleConditionalRoute,
} from './todo-routes';

class TodoApp extends TestApp {
    expectedAddresses() {
        return ['todoApp'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    expectedOutlets() {
        return ['TodoApp'];
    }
    createOutlets(outlets) {
        return {
            TodoIdRenderStyleRoute: new Outlet(document.createElement('div')),
            TodoIdConditionalRoute: new Outlet(document.createElement('div')),
            TodoIdRenderStyleConditionalRoute: new Outlet(document.createElement('div')),
        };
    }
    mount() {
        return {
            '{renderStyle=\\w+}':
                TodoIdRenderStyleRoute
                    .addresses('todoIdRenderStyle').setup(() => mountSpies)
                    .outlets('TodoIdRenderStyleRoute'),
        };
    }
    mountConditionals() {
        return {
            '*':
                TodoIdConditionalRoute
                    .outlets('TodoIdConditionalRoute')
                    .setup(() => cMountSpies),
            '+todoIdRenderStyle':
                TodoIdRenderStyleConditionalRoute
                    .outlets('TodoIdRenderStyleConditionalRoute')
                    .setup(() => cMountSpies),
        };
    }
}

export default TodoApp;
