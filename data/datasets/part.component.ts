import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-part',
    templateUrl: './part.component.html',
    styleUrls: ['./part.component.scss']
})
export class PartComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PART,
            searchOnInit: true,
            keepFilters: true,
            pageSize: 50
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            partName: [null, [CustomValidators.required]],
            sku: [null, [CustomValidators.required]],
            stockLevel: [0, [CustomValidators.required]],
            unitPrice: [0, [CustomValidators.required]],
            supplier: [null],
            isCompatible: [true]
        });
    }

    search(): void {
        const skuValue = this.f.sku.value;
        const stockLevel = this.f.stockLevel.value;
        if (skuValue) {
            this.service.addParameter('sku', skuValue);
        }
        if (stockLevel) {
            this.service.addParameter('stock_gt', stockLevel);
        }
        super.search(false);
    }

    getBooleans(): void {
        this.booleans = this.makeBoolChoices();
    }

    checkInventory(): void {
        this.service.loadFile('check-inventory', {});
    }
}
