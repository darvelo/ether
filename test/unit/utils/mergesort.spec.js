import mergesort from '../../../src/utils/mergesort';

describe('MergeSort', () => {
    it('sorts an array of numbers', () => {
        let array = [ 1,2,3,4 ];
        mergesort(array, (a, b) => b - a);
        array.should.deep.equal([ 4,3,2,1 ]);
    });

    it('sorts objects by property', () => {
        let array = [
            {x: 1},
            {x: 2},
            {x: 3},
            {x: 4},
        ];
        mergesort(array, (a, b) => b.x - a.x);
        array.should.deep.equal([
            {x: 4},
            {x: 3},
            {x: 2},
            {x: 1},
        ]);
    });
});
