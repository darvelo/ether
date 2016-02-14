import RootApp from '../../../../src/classes/root-app';

import {
    spies,
} from '../sinon-spies';

import {
    HomeRoute,
    UserRoute,
    UserConditionalRoute,
    NotificationsRoute,
} from './root-routes';

class MyRootApp extends RootApp {
    expectedOutlets() {
        return [];
    }
    mount() {
        return {
            '':
                HomeRoute
                    .addresses('home', 'homeReturnNull', 'homeThrowError')
                    .setup(() => spies),
            'user/{id=\\d+}':
                UserRoute
                    .addresses('user', 'getUserRoute')
                    .setup(() => spies),
        };
    }
    mountConditionals() {
        return {
            '*':
                NotificationsRoute
                    .addresses('notifications')
                    .setup(() => spies),
            '+user':
                UserConditionalRoute
                    .addresses('userConditional')
                    .setup(() => spies),
        };
    }
}

export default MyRootApp;
