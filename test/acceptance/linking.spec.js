import {
    routeAddress,
    rootRouteAddress,
    anythingRouteAddress,
    conditionalRouteAddress,
    appAddress,
    rootAppAddress,
    MyRootApp,
} from '../utils/generic-app-under-test';

describe('linkTo', () => {
    let defaultOpts, params;

    beforeEach(() => {
        defaultOpts = {
            debug: true,
            addresses: [rootAppAddress],
            outlets: {},
            params: [],
        };
        params = {
            id: 10,
            name: 'dave',
            action: 'go',
        };
    });

    it('throws if address is not a string', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        expect(() => route.linkTo([], params)).to.throw(TypeError, 'MyRoute#linkTo(): Address given was not a string.');
    });

    it('throws if params is not an object', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let address = routeAddress;
        expect(() => route.linkTo(address, [])).to.throw(TypeError, 'MyRoute#linkTo(): Params given was not an object.');
    });

    it('throws if address was never registered', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let address = 'nope';
        expect(() => route.linkTo(address, params)).to.throw(Error, `MyRoute#linkTo(): Address given was never registered: "${address}".`);
    });

    it('throws if address does not reference a Route', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let address = appAddress;
        expect(() => route.linkTo(appAddress, params)).to.throw(Error, `MyRoute#linkTo(): Address given does not refer to a Route instance: "${address}".`);
    });

    it('throws if the route is not in parentApp\'s MountMapper', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let address = conditionalRouteAddress;
        expect(() => route.linkTo(conditionalRouteAddress, params)).to.throw(Error, `MyRoute#linkTo(): Address given does not refer to a non-conditional Route instance: "${address}". Route was: MyConditionalRoute.`);
    });

    it('throws if missing any params needed to navigate', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let address = routeAddress;
        delete params.id;
        delete params.action;
        expect(() => route.linkTo(address, params)).to.throw(Error, `MyRoute#linkTo(): Missing params for destination "MyRoute" at address "${address}": ["action","id"].`);
    });

    it('constructs the right URL path', () => {
        let rootApp   = new MyRootApp(defaultOpts);
        let myRoute   = rootApp._atAddress(routeAddress);
        let rootRoute = rootApp._atAddress(rootRouteAddress);
        expect(myRoute.linkTo(routeAddress, params)).to.equal('/abc/10xyz/hello/dave123/go');
        expect(myRoute.linkTo(rootRouteAddress, params)).to.equal('/');
        expect(rootRoute.linkTo(routeAddress, params)).to.equal('/abc/10xyz/hello/dave123/go');
        expect(rootRoute.linkTo(rootRouteAddress, params)).to.equal('/');
    });

    it('defaults params to empty object if one was not passed in', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let address = rootRouteAddress;
        expect(() => route.linkTo(address)).to.not.throw();
        expect(route.linkTo(address)).to.equal('/');
    });

    it('escapes params with encodeURIComponent()', () => {
        let rootApp   = new MyRootApp(defaultOpts);
        let myRoute   = rootApp._atAddress(routeAddress);
        let rootRoute = rootApp._atAddress(rootRouteAddress);
        let address   = anythingRouteAddress;
        let params = {
            id: 10,
            name: 'hello world',
            action: 'go/?&+=#'
        };
        let expected = `/a10b/c${encodeURIComponent(params.name)}d/e${encodeURIComponent(params.action)}f`;
        expect(myRoute.linkTo(address, params)).to.equal(expected);
        expect(rootRoute.linkTo(address, params)).to.equal(expected);
    });

    it('honors basePath option', () => {
        defaultOpts.basePath = 'base';
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let expectedPathWithBasepath    = '/base/abc/10xyz/hello/dave123/go';
        let expectedPathWithoutBasepath = '/abc/10xyz/hello/dave123/go';
        let opts = {basePath: false};
        expect(route.linkTo(routeAddress, params, opts)).to.equal(expectedPathWithoutBasepath);
        opts.basePath = true;
        expect(route.linkTo(routeAddress, params, opts)).to.equal(expectedPathWithBasepath);
        delete opts.basePath;
        expect(route.linkTo(routeAddress, params, opts)).to.equal(expectedPathWithBasepath);
    });

    it('uses transformer fn option to get param values', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let params  = {
            model_id: 25,
            model_name: 'bob',
            model_action: 'start',
        };
        function transformer(paramName) {
            return `model_${paramName}`;
        }
        let opts = {transformer};
        expect(route.linkTo(routeAddress, params, opts)).to.equal('/abc/25xyz/hello/bob123/start');
    });

    it('throws if the link cannot be navigated to', () => {
        let rootApp = new MyRootApp(defaultOpts);
        let route   = rootApp._atAddress(routeAddress);
        let address = routeAddress;
        let expectedPath = 'abc/hixyz/hello/dave123/go';
        params.id = 'hi';
        expect(() => route.linkTo(address, params)).to.throw(Error, `MyRoute#linkTo(): Navigation to "MyRoute" at address "${address}" will fail for constructed URL: "${expectedPath}".`);
    });
});
