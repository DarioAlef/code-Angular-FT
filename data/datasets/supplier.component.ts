import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-supplier',
    templateUrl: './supplier.component.html',
    styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.SUPPLIER,
            searchOnInit: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            companyName: ['', [CustomValidators.required]],
            taxId: ['', [CustomValidators.required]],
            email: ['', [CustomValidators.required]],
            phone: [''],
            active: [true]
        });
    }

    search(): void {
        this.service.addParameter('activeOnly', true);
        super.search();
    }
}
