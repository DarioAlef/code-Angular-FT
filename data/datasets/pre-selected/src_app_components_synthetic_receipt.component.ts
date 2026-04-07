import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-receipt',
    templateUrl: './receipt.component.html',
    styleUrls: ['./receipt.component.scss']
})
export class ReceiptComponent extends BaseComponent<any> implements OnInit {

    @Input() invoiceId: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.RECEIPT,
            searchOnInit: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (this.invoiceId) {
            this.formGroup.get('invoiceId').setValue(this.invoiceId);
            this.search();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            receiptNumber: ['', [CustomValidators.required]],
            amountReceived: [0, [CustomValidators.required]],
            invoiceId: [null],
            paymentMethod: ['CASH']
        });
    }

    search(): void {
        if (this.invoiceId) {
            this.service.addParameter('invoiceId', this.invoiceId);
        }
        super.search();
    }
}
