import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../app/app.urls';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-discount-coupon',
    templateUrl: './discount-coupon.component.html'
})
export class DiscountCouponComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.DISCOUNT_COUPON,
            searchOnInit: true,
            keepFilters: true,
            nextRouteUpdate: 'marketing/coupons'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            code: [null, [CustomValidators.required, CustomValidators.nonStartWithBlank]],
            discountType: ['PERCENTAGE', [CustomValidators.required]],
            value: [0, [CustomValidators.required]],
            minSpend: [0],
            expiryDate: [null, [CustomValidators.required]],
            usageLimit: [null],
            active: [true]
        });
    }

    search(): void {
        const filters = this.v;
        if (filters.discountType) {
            this.service.addParameter('type', filters.discountType);
        }
        if (filters.expiryDate) {
            this.service.addParameter('expires_after', filters.expiryDate);
        }
        super.search(true);
    }
}
