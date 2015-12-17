// require source components
var componentsContext = require.context('./src', true, /\.js?$/);
componentsContext.keys().forEach(componentsContext);

// require functional tests
var functionalTestsContext = require.context('./test/functional', true, /\.spec\.js?$/);
functionalTestsContext.keys().forEach(functionalTestsContext);

// require unit tests
var unitTestsContext = require.context('./test/unit/classes', true, /\.spec\.js?$/);
unitTestsContext.keys().forEach(unitTestsContext);
