import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-billing',
    templateUrl: './billing.component.html',
    styleUrls: ['./billing.component.scss']
})
export class BillingComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.BILLING,
            searchOnInit: true,
            keepFilters: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            billingPeriod: [null, [CustomValidators.required]],
            grossRevenue: [0, [CustomValidators.required, Validators.min(0)]],
            netRevenue: [0, [CustomValidators.required]],
            taxRate: [0, [Validators.required]],
            confirmed: [false]
        });
    }

    saveOrUpdate(): void {
        super.saveOrUpdate();
    }
}
