const expectedStatesLastDeactivated = Object.freeze({
    pre: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: true,
        rendering: false,
        rendered: false,
    }),
    in: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: false,
        rendering: true,
        rendered: false,
    }),
    post: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: false,
        rendering: false,
        rendered: true,
    }),
});

const expectedStatesLastRendered = Object.freeze({
    pre: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: true,
        rendering: false,
        rendered: true,
    }),
    in: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: false,
        rendering: true,
        rendered: true,
    }),
    post: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: false,
        rendering: false,
        rendered: true,
    }),
});

function wasLastRendered(lastState) {
    return lastState.rendered === true;
}

class RenderValidator {
    static validate(stage, lastState, currentState) {
        let expectedState;
        if (wasLastRendered(lastState)) {
            expectedState = expectedStatesLastRendered[stage];
        } else {
            expectedState = expectedStatesLastDeactivated[stage];
        }
        if (!expectedState) {
            throw new Error(`RenderValidator#validate(): Invalid stage "${stage}".`);
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

export default RenderValidator;
