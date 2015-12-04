class Addressable {
    static transform(modified, ...names) {
        modified._addresses = names;
    }
}

export default Addressable;
