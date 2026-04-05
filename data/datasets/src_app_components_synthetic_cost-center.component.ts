import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-cost-center',
    templateUrl: './cost-center.component.html',
    styleUrls: ['./cost-center.component.scss']
})
export class CostCenterComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.COST_CENTER,
            searchOnInit: true,
            associative: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            code: ['', [CustomValidators.required]],
            name: ['', [CustomValidators.required]],
            budgetLimit: [0, [CustomValidators.required]],
            responsibleUser: [null]
        });
    }
}
