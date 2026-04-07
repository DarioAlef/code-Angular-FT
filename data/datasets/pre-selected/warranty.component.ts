import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-warranty',
    templateUrl: './warranty.component.html',
    styleUrls: ['./warranty.component.scss']
})
export class WarrantyComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.WARRANTY,
            searchOnInit: true,
            nextRoute: 'service-orders'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            serviceOrderId: [null, [CustomValidators.required]],
            clientId: [null, [CustomValidators.required]],
            startDate: [null, [CustomValidators.required]],
            durationMonths: [12, [CustomValidators.required, CustomValidators.number]],
            termsAndConditions: [null, [CustomValidators.required]],
            isActive: [true]
        });
    }

    viewWarrantyHistory(id: number): void {
        this.history(id, 'termsAndConditions');
    }

    changeStatus(warranty: any): void {
        this.toggle(warranty, 'isActive', () => {
            this.toast.info('info', 'warranty-status-updated');
        });
    }

    goToActiveServiceOrder(): void {
        const orderId = this.formGroup.value.serviceOrderId;
        if (orderId) {
            this.goToPage('service-orders/' + orderId);
        }
    }
}
