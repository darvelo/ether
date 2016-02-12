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
    mount() {
        return {
            '{renderStyle=\\w+}': TodoIdRenderStyleRoute.addresses('todoIdRenderStyle').setup(() => mountSpies),
        };
    }
    mountConditionals() {
        return {
            '*': TodoIdConditionalRoute.setup(() => cMountSpies),
            '+todoIdRenderStyle': TodoIdRenderStyleConditionalRoute.setup(() => cMountSpies),
        };
    }
}

export default TodoApp;
