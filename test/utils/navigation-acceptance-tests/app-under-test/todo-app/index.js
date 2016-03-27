import Outlet from '../../../../../src/classes/outlet';

import {
    mountSpies,
    cMountSpies,
} from '../../sinon-spies';

import { SinonSpyApp } from '../base-mounts';

import {
    TodoIdRenderStyleRoute,
    TodoIdConditionalRoute,
    TodoIdRenderStyleConditionalRoute,
} from './todo-routes';

class TodoApp extends SinonSpyApp {
    expectedAddresses() {
        return ['todoApp'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    expectedOutlets() {
        return ['TodoApp'];
    }
    expectedParams() {
        return ['id'];
    }
    createOutlets(outlets) {
        outlets.TodoIdRenderStyleRoute = new Outlet(document.createElement('div'));
        outlets.TodoIdConditionalRoute = new Outlet(document.createElement('div'));
        outlets.TodoIdRenderStyleConditionalRoute = new Outlet(document.createElement('div'));
        return outlets;
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
