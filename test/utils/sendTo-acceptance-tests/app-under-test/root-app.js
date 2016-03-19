import RootApp from '../../../../src/classes/root-app';
import App from '../../../../src/classes/app';

import {
    spies,
} from '../sinon-spies';

import {
    HomeRoute,
    UserRoute,
    UserConditionalRoute,
    NotificationsRoute,
    InitSendToRoute,
    InitReceiveRoute,
    InitConditionalSendToRoute,
    InitConditionalReceiveRoute,
} from './root-routes';

class InitApp extends App {
    expectedOutlets() {
        return [];
    }
    mount() {
        return {
            'send':
                InitSendToRoute
                    .addresses('initSendTo')
                    .setup(() => spies),
            'receive':
                InitReceiveRoute
                    .addresses('initReceive')
                    .setup(() => spies),
        };
    }
    mountConditionals() {
        return {
            '*': [
                InitConditionalSendToRoute
                    .addresses('initCondSendTo')
                    .setup(() => spies),
                InitConditionalReceiveRoute
                    .addresses('initCondReceive')
                    .setup(() => spies),
            ],
        };
    }
}

class MyRootApp extends RootApp {
    expectedOutlets() {
        return [];
    }
    mount() {
        return {
            '': HomeRoute
                    .addresses('home', 'homeReturnNull', 'homeThrowError')
                    .setup(() => spies),
            'user/{id=\\d+}':
                UserRoute
                    .addresses('user', 'getUserRoute')
                    .setup(() => spies),
            'init': InitApp,
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
