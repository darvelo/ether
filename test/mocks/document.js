import { document, Element } from '../mocks';

describe('document Mock', () => {
    it('creates an element with createElement', () => {
        expect(document.createElement('div')).to.be.an.instanceof(Element);
    });

    it('throws when calling querySelector', () => {
        expect(() => document.querySelector('#myElement')).to.throw();
    });
});
