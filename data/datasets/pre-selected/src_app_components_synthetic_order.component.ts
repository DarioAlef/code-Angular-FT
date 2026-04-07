import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../app/app.urls';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-order',
    templateUrl: './order.component.html'
})
export class OrderComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.ORDER,
            searchOnInit: true,
            associative: true,
            associativeRoute: 'v1/orders/track'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            orderNumber: [null, [CustomValidators.required]],
            status: ['PENDING', [CustomValidators.required]],
            total: [0],
            paymentMethodId: [null],
            shippingAddress: [null, [CustomValidators.required]],
            createdAt: [null]
        });
    }

    search(): void {
        const filters = this.v;
        if (filters.status) {
            this.service.addParameter('order_status', filters.status);
        }
        if (filters.orderNumber) {
            this.service.addParameter('number', filters.orderNumber);
        }
        super.search(true);
    }
}
