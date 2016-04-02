import { Route } from 'ether';

class LoadingRoute extends Route {
    expectedAddresses() {
        return ['loading'];
    }
    addressesHandlers() {
        return ['loadEvent'];
    }
    expectedOutlets() {
        return ['loading'];
    }
    init() {
        this.spinner = document.createElement('p');
        this.spinner.id = 'loading-spinner';
        this.spinner.textContent = 'LOADING!';
        this.outlets.loading.appendChild(this.spinner);
        this.unspin();
    }
    spin() {
        this.spinner.style.display = 'block';
    }
    unspin() {
        this.spinner.style.display = 'none';
    }
    loadEvent(data) {
        if (data === 'spin') {
            this.spin();
        } else {
            this.unspin();
        }
    }
}

export default LoadingRoute;
