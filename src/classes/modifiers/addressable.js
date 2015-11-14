class Addressable {
    static transform(modified, name) {
        modified._address = name;
    }
}

export default Addressable;
