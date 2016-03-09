var PORT = require('system').env['SERVER_PORT'];

var host = 'http://localhost:' + PORT;
var path = host + '/history/';

function expectRoute(test, url, visibleSelector, notVisibleSelector) {
    return function() {
        test.assertUrlMatch(url);
        test.assertVisible(visibleSelector);
        test.assertNotVisible(notVisibleSelector);
    }
}

// log all client-side console messages and thrown Errors
casper.on('remote.message', function(msg) {
    this.log('client-side message: ' + msg);
})

casper.test.begin('History without Callback', 10, function suite(test) {
    var rootUrl      = new RegExp('^' + host + '/' + '$');
    var alternateUrl = new RegExp('^' + host + '/alternate' + '$');
    var rootSelector = '#root-route-title';
    var alternateSelector = '#alternate-route-title';
    var callbackSelector = '#load-callback';

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
    var rootUrl      = new RegExp('^' + host + '/' + '$');
    var alternateUrl = new RegExp('^' + host + '/alternate' + '$');
    var alternateSelector = '#alternate-route-title';
    var rootSelector = '#root-route-title';
    var callbackSelector = '#load-callback';

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
    var basePath = '/base';
    var rootUrl      = new RegExp('^' + host + basePath + '/' + '$');
    var alternateUrl = new RegExp('^' + host + basePath + '/alternate' + '$');
    var rootSelector = '#root-route-title';
    var alternateSelector = '#alternate-route-title';
    casper.start(path + '?basepath=true', function() {
        test.assertUrlMatch(alternateUrl, 'navigate call in inline script does pushState using basePath');
        test.assertExists(alternateSelector);
        test.assertVisible(alternateSelector);
    });
    casper.thenClick('a#basepath-link-root', function() {
        test.assertUrlMatch(rootUrl, 'navigate call to root does pushState using basePath');
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
    var rootUrl      = new RegExp('^' + host + '/' + '$');
    var alternateUrl = new RegExp('^' + host + '/alternate' + '$');
    var rootSelector = '#root-route-title';
    var alternateSelector = '#alternate-route-title';
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
    var basePath = '/base';
    var rootUrl      = new RegExp('^' + host + basePath + '/' + '$');
    var alternateUrl = new RegExp('^' + host + basePath + '/alternate' + '$');
    var rootSelector = '#root-route-title';
    var alternateSelector = '#alternate-route-title';
    var expectRootRoute = expectRoute(test, rootUrl, rootSelector, alternateSelector);
    var expectAlternateRoute = expectRoute(test, alternateUrl, alternateSelector, rootSelector);

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
