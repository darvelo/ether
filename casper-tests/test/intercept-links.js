var PORT = require('system').env['SERVER_PORT'];

var host = 'http://localhost:' + PORT;
var path = host + '/intercept-links/';

var rootSelector = '#root-route-title';
var alternateSelector = '#alternate-route-title';
var callbackSelector = '.load-callback';

function expectHttpStatus(test, statusCode) {
    return function() {
        test.assertHttpStatus(statusCode);
    };
}

function expectRoute(opts) {
    var test = opts.test;
    var url = opts.url;
    opts.visible      = opts.visible     || [];
    opts.notVisible   = opts.notVisible  || [];
    opts.exists       = opts.exists      || [];
    opts.doesntExist  = opts.doesntExist || [];
    opts.counts       = opts.counts      || [];
    return function() {
        // user-override of opts before passing into casper methods
        if (arguments[0] === 'override') {
            var newOpts = arguments[1];
            // override old options by setting them as
            // the prototype of the new options object
            newOpts.__proto__ = opts;
            return expectRoute(newOpts);
        }
        if (url) {
            test.assertUrlMatch(url);
        }
        opts.visible.forEach(function(selector) {
            test.assertVisible(selector);
        });
        opts.notVisible.forEach(function(selector) {
            test.assertNotVisible(selector);
        });
        opts.exists.forEach(function(selector) {
            test.assertExists(selector);
        });
        opts.doesntExist.forEach(function(selector) {
            test.assertDoesntExist(selector);
        });
        opts.counts.forEach(function(pair) {
            var selector = pair[0];
            var count    = pair[1];
            test.assertElementCount(selector, count);
        });
    };
}

// log all client-side console messages and thrown Errors
casper.on('remote.message', function(msg) {
    this.log('client-side message: ' + msg);
});

/*
* interceptLinks: "all" tests
*/

casper.test.begin('interceptLinks `all` without Callback', 20, function suite(test) {
    var rootUrl      = new RegExp('^' + host + '/' + '$');
    var alternateUrl = new RegExp('^' + host + '/alternate' + '$');
    var expectRootRoute = expectRoute({
        test: test,
        url: rootUrl,
        visible: [rootSelector],
        notVisible: [alternateSelector],
        doesntExist: [callbackSelector],
    });
    var expectAlternateRoute = expectRoute({
        test: test,
        url: alternateUrl,
        visible: [alternateSelector],
        notVisible: [rootSelector],
        doesntExist: [callbackSelector],
    });

    casper.start(path + '?intercept_type=all', expectAlternateRoute);
    casper.thenClick('a#to-root', expectRootRoute);
    casper.thenClick('a#to-alternate', expectAlternateRoute);
    casper.thenClick('a#outside-link-root', expectRootRoute);
    casper.thenClick('a#outside-link-alternate', expectAlternateRoute);
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('interceptLinks `all` with Callback', 20, function suite(test) {
    var rootUrl      = new RegExp('^' + host + '/' + '$');
    var alternateUrl = new RegExp('^' + host + '/alternate' + '$');
    var expectRootRoute = expectRoute({
        test: test,
        url: rootUrl,
        visible: [rootSelector],
        notVisible: [alternateSelector],
    });
    var expectAlternateRoute = expectRoute({
        test: test,
        url: alternateUrl,
        visible: [alternateSelector],
        notVisible: [rootSelector],
    });

    casper.start(path + '?intercept_type=all&callback=true', expectAlternateRoute('override', {
        counts: [[callbackSelector, 0]],
    }));
    casper.thenClick('a#to-root', expectRootRoute('override', {
        counts: [[callbackSelector, 1]],
    }));
    casper.thenClick('a#to-alternate', expectAlternateRoute('override', {
        counts: [[callbackSelector, 2]],
    }));
    casper.thenClick('a#outside-link-root', expectRootRoute('override', {
        counts: [[callbackSelector, 3]],
    }));
    casper.thenClick('a#outside-link-alternate', expectAlternateRoute('override', {
        counts: [[callbackSelector, 4]],
    }));
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('interceptLinks `all` honors `basePath` config option', 17, function suite(test) {
    var basePath = '/base';
    var rootUrl      = new RegExp('^' + host + basePath + '/' + '$');
    var alternateUrl = new RegExp('^' + host + basePath + '/alternate' + '$');
    var expectRootRoute = expectRoute({
        test: test,
        url: rootUrl,
        visible: [rootSelector],
        notVisible: [alternateSelector],
        doesntExist: [callbackSelector],
    });
    var expectAlternateRoute = expectRoute({
        test: test,
        url: alternateUrl,
        visible: [alternateSelector],
        notVisible: [rootSelector],
        doesntExist: [callbackSelector],
    });
    var expect404 = expectHttpStatus(test, 404);

    casper.start(path + '?intercept_type=all&basepath=true', expectAlternateRoute);
    casper.thenClick('a#basepath-link-root', expectRootRoute);
    casper.thenClick('a#basepath-link-alternate', expectAlternateRoute);
    casper.thenClick('a#basepath-link-root', expectRootRoute);
    // clicking a link without the basePath will fail
    casper.thenClick('a#to-alternate', expect404);
    casper.run(function() {
        test.done();
    });
});

/*
* interceptLinks: "outlets" tests
*/

casper.test.begin('interceptLinks `outlets` without Callback', 13, function suite(test) {
    var rootUrl      = new RegExp('^' + host + '/' + '$');
    var alternateUrl = new RegExp('^' + host + '/alternate' + '$');
    var expectRootRoute = expectRoute({
        test: test,
        url: rootUrl,
        visible: [rootSelector],
        notVisible: [alternateSelector],
        doesntExist: [callbackSelector],
    });
    var expectAlternateRoute = expectRoute({
        test: test,
        url: alternateUrl,
        visible: [alternateSelector],
        notVisible: [rootSelector],
        doesntExist: [callbackSelector],
    });
    var expect404 = expectHttpStatus(test, 404);

    casper.start(path + '?intercept_type=outlets', expectAlternateRoute);
    casper.thenClick('a#to-root', expectRootRoute);
    casper.thenClick('a#to-alternate', expectAlternateRoute);
    casper.thenClick('a#outside-link-alternate', expect404);
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('interceptLinks `outlets` with Callback', 13, function suite(test) {
    var rootUrl      = new RegExp('^' + host + '/' + '$');
    var alternateUrl = new RegExp('^' + host + '/alternate' + '$');
    var expectRootRoute = expectRoute({
        test: test,
        url: rootUrl,
        visible: [rootSelector],
        notVisible: [alternateSelector],
    });
    var expectAlternateRoute = expectRoute({
        test: test,
        url: alternateUrl,
        visible: [alternateSelector],
        notVisible: [rootSelector],
    });
    var expect404 = expectHttpStatus(test, 404);

    casper.start(path + '?intercept_type=outlets&callback=true', expectAlternateRoute('override', {
        counts: [[callbackSelector, 0]],
    }));
    casper.thenClick('a#to-root', expectRootRoute('override', {
        counts: [[callbackSelector, 1]],
    }));
    casper.thenClick('a#to-alternate', expectAlternateRoute('override', {
        counts: [[callbackSelector, 2]],
    }));
    casper.thenClick('a#outside-link-alternate', expect404);
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('interceptLinks `outlets` honors `basePath` config option', 17, function suite(test) {
    var basePath = '/base';
    var rootUrl      = new RegExp('^' + host + basePath + '/' + '$');
    var alternateUrl = new RegExp('^' + host + basePath + '/alternate' + '$');
    var expectRootRoute = expectRoute({
        test: test,
        url: rootUrl,
        visible: [rootSelector],
        notVisible: [alternateSelector],
        doesntExist: [callbackSelector],
    });
    var expectAlternateRoute = expectRoute({
        test: test,
        url: alternateUrl,
        visible: [alternateSelector],
        notVisible: [rootSelector],
        doesntExist: [callbackSelector],
    });
    var expect404 = expectHttpStatus(test, 404);

    casper.start(path + '?intercept_type=outlets&basepath=true', expectAlternateRoute);
    casper.thenClick('a#to-basepath-root', expectRootRoute);
    casper.thenClick('a#to-basepath-alternate', expectAlternateRoute);
    casper.thenClick('a#to-basepath-root', expectRootRoute);
    // clicking a link without the basePath will fail
    casper.thenClick('a#to-alternate', expect404);
    casper.run(function() {
        test.done();
    });
});

/*
* interceptLinks: "none" tests
*/

casper.test.begin('interceptLinks `none` does not intercepts links', 20, function suite(test) {
    var thePath = path + '?intercept_type=none';
    var alternateUrl = new RegExp('^' + host + '/alternate' + '$');
    var expectAlternateRoute = expectRoute({
        test: test,
        url: alternateUrl,
        visible: [alternateSelector],
        notVisible: [rootSelector],
        doesntExist: [callbackSelector],
    });
    var expect404 = expectHttpStatus(test, 404);

    casper.start(thePath, expectAlternateRoute);
    casper.thenClick('a#to-alternate', expect404);
    casper.thenOpen(thePath, expectAlternateRoute);
    casper.thenClick('a#to-basepath-alternate', expect404);
    casper.thenOpen(thePath, expectAlternateRoute);
    casper.thenClick('a#outside-link-alternate', expect404);
    casper.thenOpen(thePath, expectAlternateRoute);
    casper.thenClick('a#basepath-link-alternate', expect404);
    casper.run(function() {
        test.done();
    });
});
