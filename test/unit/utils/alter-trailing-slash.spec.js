import {
    hasTrailingSlash,
    addTrailingSlash,
    removeTrailingSlash
} from '../../../src/utils/alter-trailing-slash';

describe('Alter Trailing Slash Util', () => {
    it('returns whether str has a trailing slash', () => {
        expect(hasTrailingSlash('/')).to.be.true;
        expect(hasTrailingSlash('/woot/')).to.be.true;
        expect(hasTrailingSlash('/all/your/base/')).to.be.true;
        expect(hasTrailingSlash('///')).to.be.true;
        expect(hasTrailingSlash('')).to.be.false;
        expect(hasTrailingSlash('/woot')).to.be.false;
        expect(hasTrailingSlash('/all/your/base')).to.be.false;
    });

    it('adds a trailing slash if there isn\'t one already', () => {
        expect(addTrailingSlash('')).to.equal('/');
        expect(addTrailingSlash('/')).to.equal('/');
        expect(addTrailingSlash('///')).to.equal('///');
        expect(addTrailingSlash('/woot')).to.equal('/woot/');
        expect(addTrailingSlash('/woot/')).to.equal('/woot/');
        expect(addTrailingSlash('/all/your/base')).to.equal('/all/your/base/');
        expect(addTrailingSlash('/all/your/base/')).to.equal('/all/your/base/');
    });

    it('removes all trailing slashes', () => {
        expect(removeTrailingSlash('')).to.equal('');
        expect(removeTrailingSlash('/')).to.equal('');
        expect(removeTrailingSlash('///')).to.equal('');
        expect(removeTrailingSlash('/woot')).to.equal('/woot');
        expect(removeTrailingSlash('/woot/')).to.equal('/woot');
        expect(removeTrailingSlash('/woot///')).to.equal('/woot');
        expect(removeTrailingSlash('/all/your/base')).to.equal('/all/your/base');
        expect(removeTrailingSlash('/all/your/base/')).to.equal('/all/your/base');
        expect(removeTrailingSlash('/all/your/base///')).to.equal('/all/your/base');
    });
});
