import diffObjects from '../../../src/utils/diff-objects';

describe('Diff Objects Util', () => {
    it('throws if either argument is not an object', () => {
        expect(() => diffObjects(1, {})).to.throw(TypeError, 'diffObjects(): was not passed two objects.');
        expect(() => diffObjects({}, [])).to.throw(TypeError, 'diffObjects(): was not passed two objects.');
        expect(() => diffObjects(1, '')).to.throw(TypeError, 'diffObjects(): was not passed two objects.');
    });

    it('returns only the properties that are different', () => {
        let o1 = {
            a: 1,
            b: 'hi',
            c: 'in-o1',
            d: true,
        };
        let o2 = {
            a: 2,
            b: 'hi',
            c: 'in-o2',
            d: false,
        };
        expect(diffObjects(o1, o2)).to.deep.equal({
            a: [1, 2],
            c: ['in-o1', 'in-o2'],
            d: [true, false],
        });
    });

    it('returns differences if a property exists on one object but not the other', () => {
        let o1 = {a: 1};
        let o2 = {b: 2};
        expect(diffObjects(o1, o2)).to.deep.equal({
            a: [1, undefined],
            b: [undefined, 2],
        });
    });

    it('returns null if no differences', () => {
        let o1 = {
            a: 1,
            b: 'hi',
            c: 'in-o1',
            d: true,
        };
        let o2 = {
            a: 1,
            b: 'hi',
            c: 'in-o1',
            d: true,
        };
        expect(diffObjects(o1, o2)).to.equal(null);
        expect(diffObjects({}, {})).to.equal(null);
    });

    it('does not throw if an existing object property is a number, string, or boolean', () => {
        let o1 = {};
        let o2 = {};
        o1.a = true;
        o1.b = false;
        expect(() => diffObjects(o1, o2)).to.not.throw();
        o1.a = 1;
        o1.b = 2;
        expect(() => diffObjects(o1, o2)).to.not.throw();
        o1.a = 'hi';
        o1.b = 'there';
        expect(() => diffObjects(o1, o2)).to.not.throw();
    });

    it('throws if an existing object property is not a number, string, or boolean', () => {
        let o1 = {};
        let o2 = {};
        o1.a = ['hi'];
        expect(() => diffObjects(o1, o2)).to.throw(TypeError, 'diffObjects(): argument 1 had a property "a" that was not a number, string, or boolean: ["hi"].');
        o1.a = {hi:1};
        expect(() => diffObjects(o1, o2)).to.throw(TypeError, 'diffObjects(): argument 1 had a property "a" that was not a number, string, or boolean: {"hi":1}.');
        delete o1.a;
        o2.b = null;
        expect(() => diffObjects(o1, o2)).to.throw(TypeError, 'diffObjects(): argument 2 had a property "b" that was not a number, string, or boolean: null.');
    });
});
