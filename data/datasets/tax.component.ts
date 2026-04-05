import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-tax',
    templateUrl: './tax.component.html',
    styleUrls: ['./tax.component.scss']
})
export class TaxComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TAX,
            searchOnInit: true,
            nextRoute: '/finance/settings'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            taxName: ['', [CustomValidators.required]],
            percentage: [0, [CustomValidators.required]],
            jurisdiction: ['', [CustomValidators.required]],
            effectiveDate: [null, [CustomValidators.required]]
        });
    }

    saveOrUpdate(): void {
        console.log('Validating tax configuration...');
        this.service.addParameter('validatedBy', 'system');
        super.saveOrUpdate();
    }
}
