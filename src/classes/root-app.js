import App from './app';

class RootApp extends App {
    constructor(options) {
        if (typeof options === 'object') {
            options.rootApp = true;
        }
        super(options);
        this._addresses = {};
    }

    _registerAddress(name, dest) {
        if (!(dest instanceof App) && !(dest instanceof Route)) {
            throw new TypeError([
                Object.getPrototypeOf(this).constructor.name,
                ' cannot register an address for a non-App/non-Route instance, ',
                Object.getPrototypeOf(dest).constructor.name,
                '.',
            ].join(''));
        }

        if (name in this._addresses) {
            throw new Error([
                Object.getPrototypeOf(this).constructor.name,
                ' address "',
                name,
                '" already taken. Could not register the address for ',
                Object.getPrototypeOf(dest).constructor.name,
                '.',
            ].join(''));
        }

        this._addresses[name] = dest;
    }

    _atAddress(name) {
        return this._addresses[name];
    }

    start() {
        window.addEventListener('popstate', this.popstate.bind(this), false);
        window.addEventListener('click', this.interceptLinks.bind(this), false);
        let state = window.history.state;
        if (state) {
            // we've loaded the page and it had previous state
            // perform initial routing
            // this should use the same function as this.popstate
        }
    }

    interceptLinks(event) {
        // delegate to all links that have same origin
        // and descend from this.rootURL, then preventDefault()
        // also should pushState()
    }
}

export default RootApp;

//  hide when paths diverge
//  destroy when params diverge
//  render occurs at the same point as divergence.
//
//  show when all lastState params on the stack for each app/route recursively were the same as what's being navigated to after a pop or during a push (EXCEPTION BELOW)
//  if during a push, the paths and params are exactly the same as on all stacks, do nothing. we're navigating to a page we're already on. (we could actually just store the current path on the root app after a successful route and save ourselves the recursive search by checking against it. we can't store the path on the root until the routing succeeds because we have to be careful the routing won't end in a 404).

var routingRecord =  {
    fullUrl: 'full URL from popstate event or window.load event',
    // if found, proceed with routing after hiding/destroying as necessary.
    // if 404, push 404 onto the stack and pass it this object or a subset,
    // just enough of a consistent interface for the user to do something
    // useful with it.
    //
    // with history.state, this property will actually be out of sync if
    // the route mappings are updated, so history.state should not have
    // this property.
    type: 'found or 404',
    // holds the point where the path diverged, so that recursive hide/destroy
    // can take place before a recursive render does.
    // if false, both path and params are exactly the same, so do nothing.
    diverge: {
        // route: AppInstance,
        // path = destroy, params = hide
        type: 'params or path',
        url: 'not needed, should be on top of stack already (?)'
    },
    // if a link is clicked, we need to do a pushState on success (or 404)
    doPushState: true,
    // all routes potentially need querystring params
    //     ?sortAsc=true&column=3&title=Count
    queryParams: {
        sortAsc: true,
        column: 3,
        title: 'Count',
    },
    // the Route path to be followed to render a url completely
    // the params will be compounded on each step, so the third route
    // will receive: {
    //    id: 1,
    //    name: 'Jeff',
    // }
    steps: [
        {
            urlpath: 'first/{id}/',
            params: {id: 1},
        },
        {
            urlpath: 'second/{name}/',
            params: {name: 'Jeff'},
        },
        {
            urlpath: 'edit',
            params: {},
        }
    ]
};
