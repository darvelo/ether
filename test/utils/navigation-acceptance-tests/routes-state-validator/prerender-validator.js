const expectedStatesLastDeactivated = Object.freeze({
    pre: Object.freeze({
        deactivating: false,
        deactivated: true,
        prerendering: false,
        prerendered: false,
        rendering: false,
        rendered: false,
    }),
    in: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: true,
        prerendered: false,
        rendering: false,
        rendered: false,
    }),
    post: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: true,
        rendering: false,
        rendered: false,
    }),
});

const expectedStatesLastRendered = Object.freeze({
    pre: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: false,
        rendering: false,
        rendered: true,
    }),
    in: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: true,
        prerendered: false,
        rendering: false,
        rendered: true,
    }),
    post: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: true,
        rendering: false,
        rendered: true,
    }),
});

function wasLastDeactivated(lastState) {
    return lastState.deactivated === true;
}

function wasLastRendered(lastState) {
    return lastState.rendered === true;
}

class PrerenderValidator {
    static validate(stage, lastState, currentState) {
        let expectedState;
        if (wasLastRendered(lastState)) {
            expectedState = expectedStatesLastRendered[stage];
        } else if (stage === 'pre' && !wasLastDeactivated(lastState)){
            // the last state for a to-be-prerendered route
            // must be one of "rendered" or "deactivated"
            throw new Error(`PrerenderValidator#validate(): For stage "pre", invalid lastState... was neither last rendered nor last deactivated. ${JSON.stringify(lastState)}`);
        } else {
            // default to this if we know the route wasn't last rendered
            expectedState = expectedStatesLastDeactivated[stage];
        }
        if (!expectedState) {
            throw new Error(`PrerenderValidator#validate(): Invalid stage "${stage}".`);
        }
        expect(currentState).to.deep.equal(expectedState);
        return true;
    }

    /**
     * Check whether the existing CSS classes on the element are as expected.
     * @param {string} stage The stage of calling the render() function on the route, one of `pre`, `in`, or `post`.
     * @param {string} DOMclassName The result of getting `element.className` on a DOM element.
     * @return {bool} Whether the existing CSS classes on the element are as expected.
     */
    static validateCSSClasses(stage, DOMclassName) {
        return true;
    }
}

export default PrerenderValidator;
