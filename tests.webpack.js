// require source components
var componentsContext = require.context('./src', true, /\.js?$/);
componentsContext.keys().forEach(componentsContext);

// require acceptance tests
var acceptanceTestsContext = require.context('./test/acceptance', true, /\.spec\.js?$/);
acceptanceTestsContext.keys().forEach(acceptanceTestsContext);

// require functional tests
var functionalTestsContext = require.context('./test/functional', true, /\.spec\.js?$/);
functionalTestsContext.keys().forEach(functionalTestsContext);

// require unit tests
var classesUnitTestsContext = require.context('./test/unit/classes', true, /\.spec\.js?$/);
classesUnitTestsContext.keys().forEach(classesUnitTestsContext);
var utilUnitTestsContext = require.context('./test/unit/utils', true, /\.spec\.js?$/);
utilUnitTestsContext.keys().forEach(utilUnitTestsContext);
