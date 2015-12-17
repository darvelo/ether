import ConditionalMountMapper from '../../../src/classes/conditional-mount-mapper';
import RootApp from '../../../src/classes/root-app';
import Route from '../../../src/classes/route';
import regexEqual from '../../utils/regex-equal';

class TestRootApp extends RootApp {
    expectedOutlets() {
        return [];
    }
}

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

describe('ConditionalMountMapper', () => {
    let mapper, addresses, parentData;

    beforeEach(() => {
        let rootApp = new TestRootApp({});
        mapper = new ConditionalMountMapper();
        addresses = ['first', 'second', 'third'];
        parentData = {
            rootApp,
            parentApp: rootApp,
            outlets: {},
            params: [],
        };
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
            let expectedRegex = /.*/;
            let result = mapper.parse('*');
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            result.operator.should.equal('*');
            result.addresses.should.deep.equal([]);
        });

        it('parses +', () => {
            let expectedRegex = /^(?:first|second|third)$/;
            let result = mapper.parse('+first,second,third');
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            result.operator.should.equal('+');
            result.addresses.should.deep.equal(['first', 'second', 'third']);
        });

        it('parses !', () => {
            let expectedRegex = /^(?!first$|second$|third$).*/;
            let result = mapper.parse('!first,second,third');
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            result.operator.should.equal('!');
            result.addresses.should.deep.equal(['first', 'second', 'third']);
        });

        it('throws if operator is not * and no addresses are listed', () => {
            expect(() => mapper.parse('!')).to.throw(Error, 'Conditional mounts that are not "*" require a comma-delimited list of required addresses.');
            expect(() => mapper.parse('+')).to.throw(Error, 'Conditional mounts that are not "*" require a comma-delimited list of required addresses.');
        });
    });

    describe('Adding', () => {
        it('expects mounts to be an array', () => {
            mapper.setAddresses(addresses);
            expect(() => mapper.add('*', {}, parentData)).to.throw(Error, 'ConditionalMountMapper#add() expected an array of mounts.');
        });

        it('throws if mounts is an empty array', () => {
            expect(() => mapper.add('*', [], parentData)).to.throw(Error, 'ConditionalMountMapper#add() received an empty array.');
        });

        it('requires having set a list of addresses', () => {
            expect(() => mapper.add('*', [TestRoute], parentData)).to.throw(Error, 'ConditionalMountMapper#add() was called but #setAddresses() needed to have been called first.');
        });

        it('expects parentData to be an object', () => {
            mapper.setAddresses(addresses);
            expect(() => mapper.add('*', [TestRoute], [])).to.throw(Error, 'ConditionalMountMapper#add() expected an object containing the mount\'s parent data.');
        });

        it('throws if parentData.rootApp is not an App instance', () => {
            mapper.setAddresses(addresses);
            parentData.rootApp = null;
            expect(() => mapper.add('*', [TestRoute], parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an App instance for parentData.rootApp.');
        });

        it('throws if parentData.parentApp is not an App instance', () => {
            mapper.setAddresses(addresses);
            parentData.parentApp = null;
            expect(() => mapper.add('*', [TestRoute], parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an App instance for parentData.parentApp.');
        });

        it('throws if parentData.outlets is not an Object', () => {
            mapper.setAddresses(addresses);
            parentData.outlets = null;
            expect(() => mapper.add('*', [TestRoute], parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.outlets.');
        });

        it('throws if parentData.params is not an Array', () => {
            mapper.setAddresses(addresses);
            parentData.params = null;
            expect(() => mapper.add('*', [TestRoute], parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an array for parentData.params.');
        });
    });
});
