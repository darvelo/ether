import finalDiff from '../../../src/utils/final-diff';

describe('Final Diff Util', () => {
    it('returns null if both arguments are null', () => {
        expect(finalDiff(null, null)).to.equal(null);
    });

    it('returns an object if paramsDiff is not null', () => {
        let paramsDiff = {};
        let queryParamsDiff = null;
        let result = finalDiff(paramsDiff, queryParamsDiff);
        expect(result.params).to.equal(paramsDiff);
        expect(result.queryParams).to.equal(queryParamsDiff);
    });

    it('returns an object if queryParamsDiff is not null', () => {
        let paramsDiff = null;
        let queryParamsDiff = {};
        let result = finalDiff(paramsDiff, queryParamsDiff);
        expect(result.params).to.equal(paramsDiff);
        expect(result.queryParams).to.equal(queryParamsDiff);
    });

    it('does not modify either argument', () => {
        let paramsDiff = Object.freeze({});
        let queryParamsDiff = Object.freeze({});
        expect(() => finalDiff(paramsDiff, queryParamsDiff)).to.not.throw();
    });
});
