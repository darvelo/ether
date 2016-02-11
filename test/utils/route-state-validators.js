function xor(b) {
    return function(a) {
        /* jshint bitwise: false */
        return !!(a ^ b);
    };
}

export class DeactivateValidator {
    static validate(stage, state) {
        for (let key of Object.keys(state)) {
            switch (stage) {
            case 'pre':
                if (key === 'rendered') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'in':
                if (key === 'deactivating') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'post':
                if (key === 'deactivated') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            default:
                throw new Error('DeactivateValidator#validate() bad stage: ' + stage);
            }
        }
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

export class PrerenderValidator {
    static validate(stage, state) {
        for (let key of Object.keys(state)) {
            switch (stage) {
            case 'pre':
                if (key === 'deactivated') {
                    // only one of `deactivated` or `rendered` can be true
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.satisfy(xor(state.rendered));
                } else if (key === 'rendered') {
                    if (state[key] === true) {
                    }
                    // only one of `deactivated` or `rendered` can be true
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.satisfy(xor(state.deactivated));
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'in':
                if (key === 'prerendering') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                // 'rendered' key may be true or false
                // all others should be false
                } else if (key === 'rendered'){
                    if (state[key] === true) {
                    }
                    expect(state[key], `expected state prop to be boolean: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.a('boolean');
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'post':
                if (key === 'prerendered') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                // 'rendered' key may be true or false
                // all others should be false
                } else if (key === 'rendered'){
                    expect(state[key], `expected state prop to be boolean: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.a('boolean');
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            default:
                throw new Error('DeactivateValidator#validate() bad stage: ' + stage);
            }
        }
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

export class RenderValidator {
    static validate(stage, state) {
        for (let key of Object.keys(state)) {
            switch (stage) {
            case 'pre':
                if (key === 'prerendered') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                // 'rendered' key may be true or false
                // all others should be false
                } else if (key === 'rendered'){
                    if (state[key] === true) {
                    }
                    expect(state[key], `expected state prop to be boolean: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.a('boolean');
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'in':
                if (key === 'rendering') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                // 'rendered' key may be true or false
                // all others should be false
                } else if (key === 'rendered'){
                    if (state[key] === true) {
                    }
                    expect(state[key], `expected state prop to be boolean: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.a('boolean');
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            case 'post':
                if (key === 'rendered') {
                    expect(state[key], `expected state prop to be true: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.true;
                } else {
                    expect(state[key], `expected state prop to be false: {${key}: ${state[key]}} ${JSON.stringify(state)}`).to.be.false;
                }
                break;
            default:
                throw new Error('DeactivateValidator#validate() bad stage: ' + stage);
            }
        }
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
