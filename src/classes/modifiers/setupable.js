class Setupable {
    static transform(modified, ...setupFns) {
        modified.setupFns = setupFns;
    }
}

export default Setupable;
