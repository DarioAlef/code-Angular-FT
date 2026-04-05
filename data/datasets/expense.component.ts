import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-expense',
    templateUrl: './expense.component.html',
    styleUrls: ['./expense.component.scss']
})
export class ExpenseComponent extends BaseComponent<any> implements OnInit {

    @Input() departmentId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.EXPENSE,
            searchOnInit: false,
            associative: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (this.departmentId) {
            this.search();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            description: ['', [CustomValidators.required]],
            amount: [0, [CustomValidators.required]],
            category: [null, [CustomValidators.required]],
            expenseDate: [new Date(), [CustomValidators.required]],
            costCenterId: [null]
        });
    }

    search(): void {
        if (this.departmentId) {
            this.service.addParameter('departmentId', this.departmentId);
        }
        super.search();
    }
}
