import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';
import { Utils } from '../../utilities/utils';

@Component({
    selector: 'app-leasing',
    templateUrl: './leasing.component.html'
})
export class LeasingComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.LEASING,
            searchOnInit: true,
            retrieveOnInit: true,
            nextRoute: 'leasing/list'
        });
    }

    override ngOnInit() {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            propertyId: [null, [Validators.required, CustomValidators.required]],
            ownerId: [null, [Validators.required, CustomValidators.required]],
            tenantId: [null, [Validators.required, CustomValidators.required]],
            brokerId: [null],
            leaseStartDate: [Utils.nowStr('YYYY-MM-DD'), [Validators.required, CustomValidators.required]],
            leaseEndDate: [null, [Validators.required, CustomValidators.required]],
            monthlyRent: [null, [Validators.required, Validators.min(0)]],
            securityDeposit: [null, [Validators.min(0)]],
            listingId: [null],
            contractId: [null],
            insuranceId: [null],
            status: ['PENDING_SIGNATURE']
        });
    }

    public calculateLeaseEndDate(months: number): void {
        const start = this.f.leaseStartDate.value;
        if (start) {
            const date = new Date(start);
            date.setMonth(date.getMonth() + months);
            this.f.leaseEndDate.setValue(date.toISOString().slice(0, 10));
        }
    }

    public approveLease(): void {
        this.confirm('lease.approve-confirm', 'confirm.approve').subscribe(res => {
            if (res) {
                this.f.status.setValue('APPROVED');
                this.saveOrUpdate();
            }
        });
    }

    public activateLease(): void {
        this.confirm('lease.activate-confirm').subscribe(res => {
            if (res) {
                this.f.status.setValue('ACTIVE');
                this.saveOrUpdate();
            }
        });
    }

    public checkDocuments(): void {
        const id = this.f.id.value;
        if (id) {
            this.service.getById(id, 'docs-status').subscribe(res => {
                this.toast.info('docs.status-title', 'docs.all-good');
            });
        }
    }

    public exportLeasingSummary(): void {
        this.csvExport('export-leasing-csv', 'leasing-summary.csv');
    }
}
