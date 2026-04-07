import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';
import { Utils } from '../../utilities/utils';

@Component({
    selector: 'app-contract',
    templateUrl: './contract.component.html'
})
export class ContractComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CONTRACT,
            searchOnInit: true,
            retrieveOnInit: false,
            nextRoute: 'contracts/list'
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
            startDate: [Utils.nowStr('YYYY-MM-DD'), Validators.required],
            endDate: [null, Validators.required],
            rentValue: [null, [Validators.required, Validators.min(0)]],
            securityDeposit: [null, [Validators.min(0)]],
            commissionRate: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
            status: ['DRAFT', Validators.required]
        });
    }

    public calculateEndDate(): void {
        const start = this.f.startDate.value;
        if (start) {
            const date = new Date(start);
            date.setFullYear(date.getFullYear() + 1);
            this.f.endDate.setValue(date.toISOString().slice(0, 10));
        }
    }

    public signContract(): void {
        this.confirm('contract.sign-confirm').subscribe(res => {
            if (res) {
                this.f.status.setValue('ACTIVE');
                this.saveOrUpdate();
            }
        });
    }

    public terminateContract(): void {
        this.confirm('contract.terminate-confirm').subscribe(res => {
            if (res) {
                this.f.status.setValue('TERMINATED');
                this.saveOrUpdate();
            }
        });
    }

    override search(): void {
        this.service.clearParameter();
        if (this.v.startDate) this.service.addParameter('startDate_gte', this.v.startDate);
        if (this.v.endDate) this.service.addParameter('endDate_lte', this.v.endDate);
        if (this.v.status) this.service.addParameter('status', this.v.status);
        super.search();
    }
}
