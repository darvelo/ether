import BaseValidator from './base-validator';

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

class PrerenderValidator extends BaseValidator {
    static _wasLastDeactivated(lastState) {
        return lastState.deactivated === true;
    }

    static _wasLastRendered(lastState) {
        return lastState.rendered === true;
    }

    static _getExpectedState(stage, lastState) {
        let expectedState;
        if (this._wasLastRendered(lastState)) {
            expectedState = expectedStatesLastRendered[stage];
        } else if (stage === 'pre' && !this._wasLastDeactivated(lastState)){
            // the last state for a to-be-prerendered route
            // must be one of "rendered" or "deactivated"
            throw new Error(`PrerenderValidator getExpectedState(): For stage "pre", invalid lastState... was neither last rendered nor last deactivated. ${JSON.stringify(lastState)}`);
        } else {
            // default to this if we know the route wasn't last rendered
            expectedState = expectedStatesLastDeactivated[stage];
        }
        if (!expectedState) {
            throw new Error(`PrerenderValidator getExpectedState(): Invalid stage "${stage}".`);
        }
        return expectedState;
    }
}

export default PrerenderValidator;
