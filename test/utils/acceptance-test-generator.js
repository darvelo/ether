function doTest(testFn, destination) {
    return function(done) {
        testFn(done, destination);
    };
}

export function navTest(testName, destinations, testFn, testType=null) {
    let testStarter;
    let argLen = arguments.length;
    let isTestAStub = false;

    if (argLen < 3) {
        // test only has name string, possibly with `skip` or `only`
        testType = arguments[1];
        isTestAStub = true;
    }

    if (testType) {
        testStarter = it[testType];
    } else {
        testStarter = it;
    }

    if (isTestAStub) {
        // test has no body (but is not lonely :)
        testStarter(testName);
        return;
    }

    if (!destinations.length) {
        throw new Error(`Navigation Test Generator: No destinations listed: "${testName}".`);
    }
    for (let dest of destinations) {
        let navType;
        if (typeof dest === 'string') {
            navType = 'NavString';
        } else if (typeof dest === 'object') {
            navType = 'NavObject';
        } else {
            throw new Error(`Navigation Test Generator: Wrong Test NavType: "${testName}".`);
        }
        testStarter(`${navType}: ${testName}`, doTest(testFn, dest));
    }
}

navTest.skip = function(...args) {
    navTest(...args, 'skip');
};

navTest.only = function(...args) {
    navTest(...args, 'only');
};
