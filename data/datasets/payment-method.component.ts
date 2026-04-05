import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../app/app.urls';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-payment-method',
    templateUrl: './payment-method.component.html'
})
export class PaymentMethodComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PAYMENT_METHOD,
            searchOnInit: false,
            retrieveRoute: 'v1/finance/methods'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required]],
            type: ['CREDIT_CARD', [CustomValidators.required]],
            active: [true],
            fixedFee: [0],
            percentageFee: [0]
        });
    }

    public saveMethod(): void {
        this.saveOrUpdate(event => {
            this.goToPage('settings/payments');
        });
    }
}
