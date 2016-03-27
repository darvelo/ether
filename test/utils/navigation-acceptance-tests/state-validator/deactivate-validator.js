import BaseValidator from './base-validator';

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

class DeactivateValidator extends BaseValidator {
    static _getExpectedState(stage) {
        let expectedState = expectedStates[stage];
        if (!expectedState) {
            throw new Error(`DeactivateValidator._getExpectedState(): Invalid stage "${stage}".`);
        }
        return expectedStates[stage];
    }
}

export default DeactivateValidator;
