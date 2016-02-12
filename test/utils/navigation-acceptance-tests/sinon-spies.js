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
