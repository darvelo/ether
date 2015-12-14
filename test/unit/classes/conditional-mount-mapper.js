import ConditionalMountMapper from '../../../src/classes/conditional-mount-mapper';

describe('ConditionalMountMapper', () => {
    let mapper, addresses;

    beforeEach(() => {
        mapper = new ConditionalMountMapper();
        addresses = ['first', 'second', 'third'];
    });

    it('sets a list of addresses', () => {
        mapper.setAddresses(addresses);
    });

    it('list of addresses needs to be an array', () => {
        expect(() => mapper.setAddresses({})).to.throw(TypeError, 'ConditionalMountMapper#setAddresses() expects an array.');
    });

    it('can only set addresses once', () => {
        mapper.setAddresses(addresses);
        expect(() => mapper.setAddresses(addresses)).to.throw(Error, 'ConditionalMountMapper only allows setting addresses once.');
    });

    it('can retrieve a sorted list of its addresses', () => {
        expect(mapper.getAddresses()).to.equal(null);
        mapper.setAddresses(addresses.concat('hello'));
        expect(mapper.getAddresses()).to.deep.equal(['first', 'hello', 'second', 'third']);
    });

    describe('Parsing', () => {
        it('throws if the first character is not supported', () => {
            expect(() => mapper.parse('abc')).to.throw(Error, 'ConditionalMountMapper only supports the initial character being one of this list: ["*","+","!"].');
        });

        it('parses *', () => {
            let expected = /.*/;
            expect(regexEqual(expected, mapper.parse('*'))).to.be.ok;
        });

        it('parses +', () => {
            let expected = /^(?:first|second|third)$/;
            expect(regexEqual(expected, mapper.parse('+first,second,third'))).to.be.ok;
        });

        it('parses !', () => {
            let expected = /^(?!first$|second$|third$).*/;
            expect(regexEqual(expected, mapper.parse('!first,second,third'))).to.be.ok;
        });
    });

    describe('Add', () => {
        it('requires having set a list of addresses', () => {
            expect(() => mapper.add('*', {}, {})).to.throw(Error, 'ConditionalMountMapper#add() was called but #setAddresses() needed to have been called first.');
        });
    });
});
