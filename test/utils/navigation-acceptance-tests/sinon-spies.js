// hold Sinon spies that are regenerated
// for each test, and sometimes within a test
export let mountSpies = {};
export let cMountSpies = {};

export function resetSpies() {
    // don't replace the spies object or its inner spy objects if they
    // exist since Routes will always reference the originally passed
    // in objects.
    [
        'RootRootRoute',
        'RootNewsRoute',
        'TodoIdRenderStyleRoute',
        'UserIdActionRoute',
        'UserIdMenuRouteOne',
        'UserIdMenuRouteTwo',
    ].reduce((memo, key) => {
        memo[key] = memo[key] || {};
        memo[key].prerenderSpy = sinon.spy();
        memo[key].renderSpy = sinon.spy();
        memo[key].deactivateSpy = sinon.spy();
        return memo;
    }, mountSpies);

    // don't replace the spies object or its inner spy objects if they
    // exist since Routes will always reference the originally passed
    // in objects.
    [
        'RootAllConditionalRoute',
        'RootNewsConditionalRoute',
        'RootConditionalRoute',

        'RootIdConditionalRouteOne',
        'RootIdConditionalRouteTwo',

        'TodoIdConditionalRoute',
        'TodoIdRenderStyleConditionalRoute',

        'UserIdConditionalRouteOne',
        'UserIdConditionalRouteTwo',
        'UserIdConditionalRouteThree',
        'UserIdConditionalRouteFour',
        'UserIdActionConditionalRoute',
        'UserIdMenuConditionalRouteOne',
        'UserIdMenuConditionalRouteTwo',
    ].reduce((memo, key) => {
        memo[key] = memo[key] || {};
        memo[key].prerenderSpy = sinon.spy();
        memo[key].renderSpy = sinon.spy();
        memo[key].deactivateSpy = sinon.spy();
        return memo;
    }, cMountSpies);
}

export function onAllSpyFnsBySpyNames(spies, spyNames, callback) {
    Object.keys(spies).forEach(key => {
        Object.keys(spies[key]).forEach(spyName => {
            if (spyNames.indexOf(spyName) !== -1) {
                callback(key, spyName, spies[key][spyName]);
            }
        });
    });
}

export function getAllSpyFns(spies) {
    return Object.keys(spies).reduce((memo, key) => {
        Object.keys(spies[key]).forEach(spyName => memo.push(spies[key][spyName]));
        return memo;
    }, []);
}
