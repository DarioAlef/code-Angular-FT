import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-service-order',
    templateUrl: './service-order.component.html',
    styleUrls: ['./service-order.component.scss']
})
export class ServiceOrderComponent extends BaseComponent<any> implements OnInit {

    @Input() orderId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.SERVICE_ORDER,
            searchOnInit: false,
            retrieveOnInit: true
        });
    }

    ngOnInit(): void {
        if (this.orderId) {
            this.service.addParameter('id', this.orderId);
        }
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            clientId: [null, [CustomValidators.required]],
            technicianId: [null, [CustomValidators.required]],
            equipmentId: [null, [CustomValidators.required]],
            status: ['OPEN', [CustomValidators.required]],
            priority: ['MEDIUM'],
            description: [null, [CustomValidators.required]],
            entryDate: [new Date()]
        });
    }

    saveOrUpdateFormData(): void {
        if (this.confirm('action-confirm', 'confirm-save-service-order')) {
            super.saveOrUpdateFormData();
        }
    }

    deleteRecord(id: number): void {
        this.delete(id, 'Service Order ID: ' + id, () => {
            this.goToPage('dashboard');
        });
    }
}
