import ConditionalMountMapper from '../../../src/classes/conditional-mount-mapper';
import MountMapper from '../../../src/classes/mount-mapper';
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
    let mapper, addresses, outlets, parentData;

    beforeEach(() => {
        let rootApp = new TestRootApp({});
        mapper = new ConditionalMountMapper();
        addresses = {
            'first': true,
            'second': true,
            'third': true,
        };
        outlets = {
            'first': true,
            'second': true,
            'third': true,
        };
        parentData = {
            rootApp,
            parentApp: rootApp,
            outlets: {},
            params: [],
            mountsMetadata: {
                addresses: {},
                outlets: {},
            },
            mountMapper: new MountMapper(),
        };
    });

    describe('Parsing', () => {
        it('throws if the first character is not supported', () => {
            expect(() => mapper.parse('abc')).to.throw(Error, 'ConditionalMountMapper only supports the initial character being one of this list: ["*","+","!"].');
        });

        it('parses *', () => {
            let expectedRegex = /.*/;
            let result = mapper.parse('*');
            result.logic.should.equal('*');
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            result.operator.should.equal('*');
            result.addresses.should.deep.equal([]);
        });

        it('parses +', () => {
            let expectedRegex = /^(?:first|second|third)$/;
            let result = mapper.parse('+first,second,third');
            result.logic.should.equal('+first,second,third');
            expect(regexEqual(expectedRegex, result.regex)).to.be.ok;
            result.operator.should.equal('+');
            result.addresses.should.deep.equal(['first', 'second', 'third']);
        });

        it('parses !', () => {
            let expectedRegex = /^(?!first$|second$|third$).*/;
            let result = mapper.parse('!first,second,third');
            result.logic.should.equal('!first,second,third');
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
        it('expects mounts to be an object', () => {
            expect(() => mapper.add([], parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() expected an object of mounts.');
        });

        it('expects parentData to be an object', () => {
            expect(() => mapper.add({'*': [TestRoute]}, [])).to.throw(TypeError, 'ConditionalMountMapper#add() expected an object containing the mount\'s parent data.');
        });

        it('throws if parentData.rootApp is not an App instance', () => {
            parentData.rootApp = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an App instance for parentData.rootApp.');
        });

        it('throws if parentData.parentApp is not an App instance', () => {
            parentData.parentApp = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an App instance for parentData.parentApp.');
        });

        it('throws if parentData.outlets is not an Object', () => {
            parentData.outlets = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.outlets.');
        });

        it('throws if parentData.params is not an Array', () => {
            parentData.params = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an array for parentData.params.');
        });

        it('throws if parentData.mountsMetadata is not an Object', () => {
            parentData.mountsMetadata = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.mountsMetadata.');
        });

        it('throws if parentData.mountsMetadata.addresses is not an Object', () => {
            parentData.mountsMetadata.addresses = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.mountsMetadata.addresses.');
        });

        it('throws if parentData.mountsMetadata.outlets is not an Object', () => {
            parentData.mountsMetadata.outlets = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an object for parentData.mountsMetadata.outlets.');
        });

        it('throws if parentData.mountMapper is not an instance of MountMapper', () => {
            parentData.mountMapper = null;
            expect(() => mapper.add({'*': [TestRoute]}, parentData)).to.throw(TypeError, 'ConditionalMountMapper#add() did not receive an instance of MountMapper for parentData.mountMapper.');
        });

        it('throws if a mount is an empty array', () => {
            expect(() => mapper.add({'*': []}, parentData)).to.throw(Error, 'ConditionalMountMapper#add() received an empty array for a mount.');
        });

        it('only allows adding mounts once', () => {
            expect(() => mapper.add({'*': TestRoute}, parentData)).to.not.throw();
            expect(() => mapper.add({'*': TestRoute}, parentData)).to.throw(Error, 'ConditionalMountMapper#add() can only be called once.');
        });
    });
});
