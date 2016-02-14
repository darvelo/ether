// hold Sinon spies that are regenerated
// for each test, and sometimes within a test
export let spies = {};

export function resetSpies() {
    // don't replace the spies object or its inner spy objects if they
    // exist since Routes will always reference the originally passed
    // in objects.
    [
        'HomeRoute',
        'UserRoute',
        'UserConditionalRoute',
        'NotificationsRoute',
    ].reduce((memo, key) => {
        memo[key] = memo[key] || {};
        memo[key].sendToSpy = sinon.spy();
        return memo;
    }, spies);
}

export function getAllSpyFns(spies) {
    let allSpies = Object.keys(spies).reduce((memo, key) => {
        let spiesForKey = Object.keys(spies[key]).map(spyName => spies[key][spyName]);
        memo.push(...spiesForKey);
        return memo;
    }, []);
    return allSpies;
}
