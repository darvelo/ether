import Route from '../../../../src/classes/route';
import ctorName from '../../../../src/utils/ctor-name';
import { isnt } from '../../../../src/utils/is';

class TestRoute extends Route {
    expectedOutlets() {
        return [];
    }
}

class SinonSpyRoute extends TestRoute {
    init(spies) {
        let ctorname = ctorName(this);
        if (isnt(spies, 'Object')) {
            throw new Error(`Sinon spies were not passed into ${ctorname}#init().`);
        }
        let mySpies = spies[ctorname];
        if (!mySpies) {
            throw new Error(`Sinon spies were not attached to ${ctorname}.`);
        }
        this.spies = mySpies;
    }
    receive(...args) {
        this.spies.sendToSpy(...args);
    }
}

export class HomeRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['home', 'homeReturnNull', 'homeThrowError'];
    }
    addressesHandlers() {
        return ['receive', () => null, 'throwErr'];
    }
    throwErr(msg) {
        throw Error(msg);
    }
    render(params, queryParams) {
        if (queryParams === null) {
            queryParams = {};
        }
        if (queryParams.sendTo === 'user') {
            return this.sendTo('user', queryParams.val);
        } else if (queryParams.sendTo === 'notifications') {
            return this.sendTo('notifications', queryParams.val);
        }
    }
}

export class UserRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['user', 'getUserRoute'];
    }
    addressesHandlers() {
        return ['receive', () => this];
    }
}

export class UserConditionalRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['userConditional'];
    }
    addressesHandlers() {
        return ['receive'];
    }
}

export class NotificationsRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['notifications'];
    }
    addressesHandlers() {
        return ['receive'];
    }
}

export class InitSendToRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['initSendTo'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    init(...args) {
        super.init(...args);
        this.sendTo('initReceive').then(this.spies.sendToSpy);
    }
}

export class InitReceiveRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['initReceive'];
    }
    addressesHandlers() {
        return ['receive'];
    }
    init(...args) {
        super.init(...args);
        this.initVal = 'InitReceiveRoute';
    }
    receive() {
        return this.initVal;
    }
}

export class InitConditionalSendToRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['initCondSendTo'];
    }
    addressesHandlers() {
        return [function(){}];
    }
    init(...args) {
        super.init(...args);
        this.sendTo('initCondReceive').then(this.spies.sendToSpy);
    }
}

export class InitConditionalReceiveRoute extends SinonSpyRoute {
    expectedAddresses() {
        return ['initCondReceive'];
    }
    addressesHandlers() {
        return ['receive'];
    }
    init(...args) {
        super.init(...args);
        this.initVal = 'InitConditionalReceiveRoute';
    }
    receive() {
        return this.initVal;
    }
}

