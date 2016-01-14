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
        };
        let o2 = {
            a: 2,
            b: 'hi',
            c: 'in-o2',
        };
        expect(diffObjects(o1, o2)).to.deep.equal({
            a: [1, 2],
            c: ['in-o1', 'in-o2'],
        });
    });

    it('returns null if no differences', () => {
        let o1 = {
            a: 1,
            b: 'hi',
            c: 'in-o1',
        };
        let o2 = {
            a: 1,
            b: 'hi',
            c: 'in-o1',
        };
        expect(diffObjects(o1, o2)).to.equal(null);
        expect(diffObjects({}, {})).to.equal(null);
    });

    it('throws if properties are not of the same type', () => {
        let o1 = {a:  1};
        let o2 = {a: '2'};
        expect(() => diffObjects(o1, o2)).to.throw(TypeError, 'diffObjects(): arguments had a property "a" that was not of the same type for both: [1,"2"].');
    });

    it('throws if an object property is not a number or string', () => {
        let o1 = {};
        let o2 = {};
        o1.a = ['hi'];
        expect(() => diffObjects(o1, o2)).to.throw(TypeError, 'diffObjects(): argument 1 had a property "a" that was not a number or a string: ["hi"].');
        o1.a = undefined;
        expect(() => diffObjects(o1, o2)).to.throw(TypeError, 'diffObjects(): argument 1 had a property "a" that was not a number or a string: undefined.');
        delete o1.a;
        o2.b = null;
        expect(() => diffObjects(o1, o2)).to.throw(TypeError, 'diffObjects(): argument 2 had a property "b" that was not a number or a string: null.');
    });
});
