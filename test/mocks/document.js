import { document, Element } from '../mocks';

describe('document', () => {
    it('creates an element with createElement', () => {
        expect(document.createElement('div')).to.be.an.instanceof(Element);
    });
});
