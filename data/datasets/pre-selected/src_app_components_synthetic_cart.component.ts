import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../app/app.urls';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-cart',
    templateUrl: './cart.component.html'
})
export class CartComponent extends BaseComponent<any> implements OnInit {

    @Input() cartUserId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CART,
            retrieveOnInit: true,
            retrieveIdRoute: 'checkoutId'
        });
    }

    ngOnInit(): void {
        super.ngOnInit(() => {
            if (this.cartUserId) {
                this.service.addParameter('user_id', this.cartUserId);
            }
        });
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            sessionId: [null, [CustomValidators.required]],
            items: [[]],
            totalAmount: [0],
            couponCode: [null],
            updatedAt: [new Date()]
        });
    }

    public updateCart(): void {
        this.saveOrUpdate(event => {
            this.toast.success('cart-updated', 'items-saved');
        });
    }
}
