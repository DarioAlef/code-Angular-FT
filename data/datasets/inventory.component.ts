import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../app/app.urls';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html'
})
export class InventoryComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.INVENTORY,
            searchOnInit: true,
            crossTable: true,
            pageSize: 50
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            warehouseId: [null, [CustomValidators.required]],
            productId: [null],
            quantity: [0, [CustomValidators.required]],
            minimumThreshold: [10],
            lastRestockDate: [null]
        });
    }

    search(): void {
        const filters = this.v;
        if (filters.warehouseId) {
            this.service.addParameter('warehouse', filters.warehouseId);
        }
        this.service.addParameter('low_stock', 'true');
        super.search(true);
    }
}
