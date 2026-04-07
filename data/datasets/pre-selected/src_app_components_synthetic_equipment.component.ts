import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-equipment',
    templateUrl: './equipment.component.html',
    styleUrls: ['./equipment.component.scss']
})
export class EquipmentComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.EQUIPMENT,
            searchOnInit: true,
            keepFilters: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required]],
            brand: [null, [CustomValidators.required]],
            model: [null],
            serialNumber: [null, [CustomValidators.required]],
            acquisitionDate: [null],
            isActive: [true]
        });
    }

    search(): void {
        const serial = this.f.serialNumber.value;
        if (serial) {
            this.service.addParameter('serial', serial);
        }
        super.search(true);
    }

    saveOrUpdate(): void {
        if (this.formGroup.valid) {
            super.saveOrUpdate();
        } else {
            this.toast.error('warning', 'invalid-form');
        }
    }
}
