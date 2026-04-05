import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-invoice',
    templateUrl: './invoice.component.html',
    styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.INVOICE,
            searchOnInit: true,
            nextRoute: '/finance/billing'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            invoiceNumber: [null, [CustomValidators.required]],
            totalAmount: [0, [CustomValidators.required]],
            issueDate: [new Date(), [CustomValidators.required]],
            supplierId: [null, [CustomValidators.required]],
            status: ['DRAFT']
        });
    }

    search(): void {
        super.search();
    }
}
