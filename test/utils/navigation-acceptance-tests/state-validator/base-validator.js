class BaseValidator {
    static validate(stage, lastState, currentState) {
        let expectedState = this._getExpectedState(stage, lastState);
        expect(currentState).to.deep.equal(expectedState);
        return true;
    }

    /**
     * Check whether the existing CSS classes on the element are as expected.
     * @param {string} stage The stage of calling the render() function on the mount, one of `pre`, `in`, or `post`.
     * @param {object} lastState The state object of the mount after the last navigation method was called.
     * @param {object} currentState The state object of the mount now that the current navigation method has been called.
     * @param {string} DOMclassName The result of getting `element.className` on a DOM element.
     * @return {bool} Whether the existing CSS classes on the element are as expected.
     */
    static validateCSSClasses(stage, lastState, currentState, DOMclassName) {
        let classPrefix = 'ether-';
        let expectedState = this._getExpectedState(stage, lastState);
        expectedState = Object.keys(expectedState).reduce((memo, key) => {
            memo[classPrefix + key] = expectedState[key];
            return memo;
        }, {});
        DOMclassName.split(/\s+/).forEach(name => {
            if (name.indexOf(classPrefix) === 0) {
                expect(expectedState).to.have.property(name);
                expect(expectedState[name]).to.be.true;
            }
        });
        return true;
    }
}

export default BaseValidator;
