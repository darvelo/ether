import BaseValidator from './base-validator';

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

class RenderValidator extends BaseValidator {
    static _wasLastRendered(lastState) {
        return lastState.rendered === true;
    }

    static _getExpectedState(stage, lastState) {
        let expectedState;
        if (this._wasLastRendered(lastState)) {
            expectedState = expectedStatesLastRendered[stage];
        } else {
            expectedState = expectedStatesLastDeactivated[stage];
        }
        if (!expectedState) {
            throw new Error(`RenderValidator._getExpectedState(): Invalid stage "${stage}".`);
        }
        return expectedState;
    }
}

export default RenderValidator;
