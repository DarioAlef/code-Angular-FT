import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';
import { Utils } from '../../utilities/utils';

@Component({
    selector: 'app-sale',
    templateUrl: './sale.component.html'
})
export class SaleComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.SALE,
            searchOnInit: true,
            retrieveIdRoute: 'id',
            nextRouteUpdate: 'sales/summary'
        });
    }

    override ngOnInit() {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            propertyId: [null, [Validators.required, CustomValidators.required]],
            buyerId: [null, [Validators.required, CustomValidators.required]],
            sellerId: [null, [Validators.required, CustomValidators.required]],
            brokerId: [null, [Validators.required, CustomValidators.required]],
            price: [null, [Validators.required, Validators.min(0)]],
            commissionAmount: [null, [Validators.required, Validators.min(0)]],
            saleDate: [Utils.nowStr('YYYY-MM-DD'), [Validators.required, CustomValidators.required]],
            paymentType: ['CASH', [Validators.required]],
            installments: [1, [Validators.required, Validators.min(1)]],
            notes: [null],
            status: ['PENDING', [Validators.required]]
        });
    }

    public calculateCommission(): void {
        const price = this.f.price.value;
        if (price) {
            const calculated = price * 0.05; // 5% standard commission
            this.f.commissionAmount.setValue(calculated);
        }
    }

    public finalizeSale(): void {
        this.confirm('sale.finalize-confirm', 'confirm.once-finalized').subscribe(res => {
            if (res) {
                this.f.status.setValue('FINALIZED');
                this.saveOrUpdate();
            }
        });
    }

    public generateSaleInvoice(): void {
        const id = this.f.id.value;
        if (id) {
            this.service.loadFile(`invoice/${id}`, {})
                .subscribe(response => {
                    Utils.downloadFileFromBlob(response, `sale_${id}_invoice.pdf`);
                });
        }
    }

    override search(restartIndex = false): void {
        this.service.clearParameter();
        if (this.v.price) this.service.addParameter('price_gte', this.v.price);
        if (this.v.saleDate) this.service.addParameter('saleDate', this.v.saleDate);
        super.search(restartIndex);
    }
}
