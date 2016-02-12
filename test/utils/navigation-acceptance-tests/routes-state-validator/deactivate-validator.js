const expectedStates = Object.freeze({
    pre: Object.freeze({
        deactivating: false,
        deactivated: false,
        prerendering: false,
        prerendered: false,
        rendering: false,
        rendered: true,
    }),
    in: Object.freeze({
        deactivating: true,
        deactivated: false,
        prerendering: false,
        prerendered: false,
        rendering: false,
        rendered: false,
    }),
    post: Object.freeze({
        deactivating: false,
        deactivated: true,
        prerendering: false,
        prerendered: false,
        rendering: false,
        rendered: false,
    }),
});

class DeactivateValidator {
    static validate(stage, lastState, currentState) {
        let expectedState = expectedStates[stage];
        if (!expectedState) {
            throw new Error(`DeactivateValidator#validate(): Invalid stage "${stage}".`);
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
        let classes = DOMclassName.split(/s+/).reduce((memo, name) => {
            memo[name] = true;
        }, {});
    }
}

export default DeactivateValidator;
