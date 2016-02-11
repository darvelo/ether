export function assertAppState(app, state) {
    for (let key of Object.keys(app.state)) {
        if (state === key) {
            expect(app.state[key]).to.equal(true);
        } else {
            expect(app.state[key]).to.equal(false);
        }
    }
}
