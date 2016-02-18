import { document, Element } from '../mocks';

describe('document Mock', () => {
    it('creates an element with createElement', () => {
        expect(document.createElement('div')).to.be.an.instanceof(Element);
    });

    it('creates an element with createElement that has the right nodeName', () => {
        expect(document.createElement('div').nodeName).to.equal('DIV');
    });

    it('throws when calling querySelector', () => {
        expect(() => document.querySelector('#myElement')).to.throw();
    });
});
