import { is } from '../../src/utils/is';

function doTest(testFn, ...args) {
    return function(done) {
        testFn(done, ...args);
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
        let navType, rest = [];
        if (Array.isArray(dest)) {
            [ dest, ...rest ] = dest;
        }
        if (is(dest, 'String')) {
            navType = 'NavString';
        } else if (is(dest, 'Object')) {
            navType = 'NavObject';
        } else {
            throw new Error(`Navigation Test Generator: Wrong Test NavType: "${testName}".`);
        }
        testStarter(`${navType}: ${testName}`, doTest(testFn, dest, ...rest));
    }
}

navTest.skip = function(...args) {
    navTest(...args, 'skip');
};

navTest.only = function(...args) {
    navTest(...args, 'only');
};
