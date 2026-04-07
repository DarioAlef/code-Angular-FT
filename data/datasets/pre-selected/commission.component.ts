import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';
import { Utils } from '../../utilities/utils';

@Component({
    selector: 'app-commission',
    templateUrl: './commission.component.html'
})
export class CommissionComponent extends BaseComponent<any> implements OnInit {

    @Input() brokerId: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.COMMISSION,
            searchOnInit: true,
            pageSize: 50,
            associative: true,
            associativeRoute: 'associate-broker'
        });
    }

    override ngOnInit() {
        super.ngOnInit();
        if (this.brokerId) {
            this.f.brokerId.setValue(this.brokerId);
            this.search();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            saleId: [null, [Validators.required, CustomValidators.required]],
            leasingId: [null],
            brokerId: [null, [Validators.required, CustomValidators.required]],
            amount: [0, [Validators.required, Validators.min(0)]],
            commissionDate: [Utils.nowStr('YYYY-MM-DD'), [Validators.required, CustomValidators.required]],
            commissionPercentage: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
            paymentDate: [null],
            paymentStatus: ['PENDING', [Validators.required]],
            notes: [null]
        });
    }

    public calculateCommissionAmount(baseValue: number): void {
        const percentage = this.f.commissionPercentage.value;
        if (baseValue && percentage) {
            const calculated = baseValue * (percentage / 100);
            this.f.amount.setValue(calculated);
        }
    }

    public payCommission(): void {
        this.confirm('commission.pay-confirm', 'confirm.once-paid-unchangeable').subscribe(res => {
            if (res) {
                this.f.paymentStatus.setValue('PAID');
                this.f.paymentDate.setValue(Utils.nowStr('YYYY-MM-DD'));
                this.saveOrUpdate();
            }
        });
    }

    public togglePaymentStatus(commission: any): void {
        this.toggle(commission, 'isPaid');
    }

    public viewCommissionHistory(): void {
        const id = this.f.id.value;
        if (id) {
            this.history(id);
        }
    }

    public exportCommissionsCsv(): void {
        this.csvExport('export-csv', `commissions_${Utils.nowStr('YYYYMMDD')}.csv`);
    }

    override search(restartIndex = false): void {
        this.service.clearParameter();
        if (this.v.brokerId) this.service.addParameter('brokerId', this.v.brokerId);
        if (this.v.paymentStatus) this.service.addParameter('paymentStatus', this.v.paymentStatus);
        if (this.v.commissionDate) this.service.addParameter('commissionDate_gte', this.v.commissionDate);
        super.search(restartIndex);
    }
}
