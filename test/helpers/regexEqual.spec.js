import regexEqual from '../utils/regex-equal';

describe('regexEqual', () => {
    it('throws when r1 is not a RegExp', () => {
        expect(() => regexEqual('', /./)).to.throw(Error, 'regexEqual: r1 was not a RegExp instance.');
    });

    it('throws when r2 is not a RegExp', () => {
        expect(() => regexEqual(/./, '')).to.throw(Error, 'regexEqual: r2 was not a RegExp instance.');
    });

    it('throws when r1.global !== r2.global', () => {
        let r1 = /./;
        let r2 = /./g;
        expect(() => regexEqual(r1, r2)).to.throw(Error, 'regexEqual: r1.global !== r2.global. r1.global: "false". r2.global: "true".');
    });

    it('throws when r1.multiline !== r2.multiline', () => {
        let r1 = /./;
        let r2 = /./m;
        expect(() => regexEqual(r1, r2)).to.throw(Error, 'regexEqual: r1.multiline !== r2.multiline. r1.multiline: "false". r2.multiline: "true".');
    });

    it('throws when r1.ignoreCase !== r2.ignoreCase', () => {
        let r1 = /./;
        let r2 = /./i;
        expect(() => regexEqual(r1, r2)).to.throw(Error, 'regexEqual: r1.ignoreCase !== r2.ignoreCase. r1.ignoreCase: "false". r2.ignoreCase: "true".');
    });

    it('throws when r1.source !== r2.source', () => {
        let r1 = /^hi$/;
        let r2 = /^hello$/;
        expect(() => regexEqual(r1, r2)).to.throw(Error, 'regexEqual: r1.source !== r2.source. r1.source: "^hi$". r2.source: "^hello$".');
    });
});
