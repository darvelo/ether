import { RootApp, makeOutlet } from 'ether';

import RootRoute from './root-route';
import AlternateRoute from './alternate-route';
import WindowLoadRoute from './window-load-route';
import LinkRoute from './link-route';
import LoadingRoute from './loading-route';

class MyRootApp extends RootApp {
    createOutlets(outlets) {
        outlets.main = makeOutlet({
            el: outlets.main.get(),
            append: [
                outlets.root = makeOutlet({
                    tagName: 'section',
                    classNames: ['root'],
                }),
                outlets.alternate = makeOutlet({
                    tagName: 'section',
                    classNames: ['alternate'],
                }),
                outlets.windowLoad = makeOutlet({
                    tagName: 'section',
                    classNames: ['window-load'],
                }),
                outlets.link = makeOutlet({
                    tagName: 'section',
                    classNames: ['link'],
                }),
                outlets.loading = makeOutlet({
                    tagName: 'section',
                    classNames: ['loading'],
                }),
            ],
        });
        return outlets;
    }
    mount() {
        return {
            '': RootRoute.outlets('root'),
            'alternate': AlternateRoute.outlets('alternate'),
            'window-load': WindowLoadRoute.outlets('windowLoad'),
        };
    }
    mountConditionals() {
        return {
            '*': [
                LinkRoute.outlets('link'),
                LoadingRoute.addresses('loading').outlets('loading'),
            ],
        };
    }
}

export default MyRootApp;
