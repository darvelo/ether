var PORT = require('system').env['SERVER_PORT'];

var host = 'http://localhost:' + PORT;
var path = host + '/history/';

var rootUrl      = new RegExp('^' + host + '/' + '$');
var alternateUrl = new RegExp('^' + host + '/alternate' + '$');

var basePath = '/base';
var rootBasePathUrl      = new RegExp('^' + host + basePath + '/' + '$');
var alternateBasePathUrl = new RegExp('^' + host + basePath + '/alternate' + '$');

var rootSelector = '#root-route-title';
var alternateSelector = '#alternate-route-title';
var callbackSelector = '#load-callback';

function expectRoute(test, url, visibleSelector, notVisibleSelector) {
    return function() {
        test.assertUrlMatch(url);
        test.assertVisible(visibleSelector);
        test.assertNotVisible(notVisibleSelector);
    };
}

// log all client-side console messages and thrown Errors
casper.on('remote.message', function(msg) {
    this.log('client-side message: ' + msg);
});

casper.test.begin('History without Callback', 10, function suite(test) {
    casper.start(path, function() {
        test.assertUrlMatch(alternateUrl, 'navigate call in inline script does pushState');
        test.assertExists(rootSelector);
        test.assertExists(alternateSelector);
        test.assertNotExists(callbackSelector);
        test.assertNotVisible(rootSelector);
        test.assertVisible(alternateSelector);
    });
    casper.thenClick('a#to-root', function() {
        test.assertUrlMatch(rootUrl, 'navigate call from link click does pushState');
        test.assertVisible(rootSelector);
        test.assertNotVisible(alternateSelector);
        test.assertNotExists(callbackSelector);
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History with Callback', 10, function suite(test) {
    casper.start(path + '?callback=true', function() {
        test.assertUrlMatch(alternateUrl, 'navigate call in inline script does pushState');
        test.assertExists(rootSelector);
        test.assertExists(alternateSelector);
        test.assertNotVisible(rootSelector);
        test.assertVisible(alternateSelector);
        // initial navigate call from page load
        // should have triggered the callback
        test.assertExists(callbackSelector);
        test.assertVisible(callbackSelector);
    });
    casper.thenClick('a#to-root', function() {
        test.assertUrlMatch(rootUrl, 'navigate call from link click does pushState');
        test.assertVisible(rootSelector);
        test.assertNotVisible(alternateSelector);
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History: honors `basePath` config option', 7, function suite(test) {
    casper.start(path + '?basepath=true', function() {
        test.assertUrlMatch(alternateBasePathUrl, 'navigate call in inline script does pushState using basePath');
        test.assertExists(alternateSelector);
        test.assertVisible(alternateSelector);
    });
    casper.thenClick('a#basepath-link-root', function() {
        test.assertUrlMatch(rootBasePathUrl, 'navigate call to root does pushState using basePath');
        test.assertVisible(rootSelector);
        test.assertNotVisible(alternateSelector);
    });
    casper.thenClick('a#to-alternate', function() {
        test.assertHttpStatus(404);
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History: Back and Forward Buttons work', 21, function suite(test) {
    var expectRootRoute = expectRoute(test, rootUrl, rootSelector, alternateSelector);
    var expectAlternateRoute = expectRoute(test, alternateUrl, alternateSelector, rootSelector);

    casper.start(path, expectAlternateRoute);
    casper.thenClick('a#to-root', expectRootRoute);
    casper.thenClick('a#to-alternate', expectAlternateRoute);
    casper.back().then(expectRootRoute);
    casper.back().then(expectAlternateRoute);
    casper.forward().then(expectRootRoute);
    casper.forward().then(expectAlternateRoute);
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History: Back and Forward Buttons work with basepath', 21, function suite(test) {
    var expectRootRoute = expectRoute(test, rootBasePathUrl, rootSelector, alternateSelector);
    var expectAlternateRoute = expectRoute(test, alternateBasePathUrl, alternateSelector, rootSelector);

    casper.start(path + '?basepath=true', expectAlternateRoute);
    casper.thenClick('a#basepath-link-root', expectRootRoute);
    casper.thenClick('a#basepath-link-alternate', expectAlternateRoute);
    casper.back().then(expectRootRoute);
    casper.back().then(expectAlternateRoute);
    casper.forward().then(expectRootRoute);
    casper.forward().then(expectAlternateRoute);
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History: navigate opts pushState:false', 6, function suite(test) {
    var expectAlternateRoute = expectRoute(test, alternateUrl, alternateSelector, rootSelector);
    var expectRootRouteNoPushState = expectRoute(test, alternateUrl, rootSelector, alternateSelector);

    casper.start(path, expectAlternateRoute);
    casper.thenEvaluate(function() {
        myApp.navigate('/', {pushState: false});
    });
    casper.then(expectRootRouteNoPushState);
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History: navigate opts pushState:true', 7, function suite(test) {
    var expectAlternateRoute = expectRoute(test, alternateUrl, alternateSelector, rootSelector);
    var expectRootRoute = expectRoute(test, rootUrl, rootSelector, alternateSelector);
    var historyLen;

    casper.start(path, expectAlternateRoute);
    casper.then(function() {
        historyLen = this.evaluate(function() {
            return window.history.length;
        });
    });
    casper.thenEvaluate(function() {
        myApp.navigate('/', {pushState: true});
    });
    casper.then(expectRootRoute);
    casper.then(function() {
        var newHistoryLen = this.evaluate(function() {
            return window.history.length;
        });
        test.assert(historyLen+1 === newHistoryLen, 'history length increased by 1');
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History: navigate opts pushState:false', 7, function suite(test) {
    var expectAlternateRoute = expectRoute(test, alternateUrl, alternateSelector, rootSelector);
    var expectRootRouteNoPushState = expectRoute(test, alternateUrl, rootSelector, alternateSelector);
    var historyLen;

    casper.start(path, expectAlternateRoute);
    casper.then(function() {
        historyLen = this.evaluate(function() {
            return window.history.length;
        });
    });
    casper.thenEvaluate(function() {
        myApp.navigate('/', {pushState: false});
    });
    casper.then(expectRootRouteNoPushState);
    casper.then(function() {
        var newHistoryLen = this.evaluate(function() {
            return window.history.length;
        });
        test.assert(historyLen === newHistoryLen, 'history length did not increase');
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History: navigate opts replaceState:true', 7, function suite(test) {
    var expectAlternateRoute = expectRoute(test, alternateUrl, alternateSelector, rootSelector);
    var expectRootRoute = expectRoute(test, rootUrl, rootSelector, alternateSelector);
    var historyLen;

    casper.start(path, expectAlternateRoute);
    casper.then(function() {
        historyLen = this.evaluate(function() {
            return window.history.length;
        });
    });
    casper.thenEvaluate(function() {
        myApp.navigate('/', {replaceState: true});
    });
    casper.then(expectRootRoute);
    casper.then(function() {
        var newHistoryLen = this.evaluate(function() {
            return window.history.length;
        });
        test.assert(historyLen === newHistoryLen, 'history length did not increase');
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('History: navigate opts replaceState:true overrides pushState', 7, function suite(test) {
    var expectAlternateRoute = expectRoute(test, alternateUrl, alternateSelector, rootSelector);
    var expectRootRoute = expectRoute(test, rootUrl, rootSelector, alternateSelector);
    var historyLen;

    casper.start(path, expectAlternateRoute);
    casper.then(function() {
        historyLen = this.evaluate(function() {
            return window.history.length;
        });
    });
    casper.thenEvaluate(function() {
        myApp.navigate('/', {replaceState: true, pushState: true});
    });
    casper.then(expectRootRoute);
    casper.then(function() {
        var newHistoryLen = this.evaluate(function() {
            return window.history.length;
        });
        test.assert(historyLen === newHistoryLen, 'history length did not increase');
    });
    casper.run(function() {
        test.done();
    });
});
