var PORT = require('system').env['SERVER_PORT'];

var host = 'http://localhost:' + PORT;
var path = host + '/window-load/';

// log all client-side console messages and thrown Errors
casper.on('remote.message', function(msg) {
    this.log('client-side message: ' + msg);
})

casper.test.begin('Window Load', 2, function suite(test) {
    var selector = '#window-load-route-title';
    casper.start(path, function() {
        test.assertExists(selector);
        test.assertVisible(selector);
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Window Load with Callback', 3, function suite(test) {
    var selector = '#load-callback';
    casper.start(path + '?callback=true', function() {
        test.assertExists(selector);
        test.assertVisible(selector);
        test.assertSelectorHasText(selector, 'callback called!');
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Window Load honors `basePath` config option', 2, function suite(test) {
    casper.start(path + '?basepath=true', function() {
        var selector = '#window-load-route-title';
        test.assertExists(selector);
        test.assertNotVisible(selector);
    });
    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Window Load does not perform pushState', 1, function suite(test) {
    casper.start(path, function() {
        var storedHistoryLen = casper.evaluate(function() {
            return initialHistoryLength;
        });
        var newHistoryLen = casper.evaluate(function() {
            return window.history.length;
        });
        test.assert(storedHistoryLen === newHistoryLen, 'did not increment history length');
    });
    casper.run(function() {
        test.done();
    });
});
