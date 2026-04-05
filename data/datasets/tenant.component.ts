import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';

@Component({
    selector: 'app-tenant',
    templateUrl: './tenant.component.html'
})
export class TenantComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TENANT,
            searchOnInit: true,
            retrieveOnInit: true
        });
    }

    override ngOnInit() {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            fullName: [null, [Validators.required, CustomValidators.required]],
            cpf: [null, [Validators.required, CustomValidators.cpf]],
            rg: [null],
            occupation: [null, Validators.required],
            monthlyIncome: [null, [Validators.required, Validators.min(0)]],
            maritalStatus: ['SINGLE'],
            emergencyContact: [null],
            emergencyPhone: [null]
        });
    }

    public async onSubmit(): Promise<void> {
        this.confirm('confirm.save-tenant', 'confirm.are-you-sure').subscribe(res => {
            if (res) {
                this.saveOrUpdate();
            }
        });
    }

    public toggleActiveStatus(tenant: any): void {
        this.toggle(tenant, 'isActive');
    }

    public viewHistory(tenantId: string): void {
        this.history(tenantId, 'createdAt', 'updatedAt');
    }

    public downloadReport(): void {
        this.csvExport('report-csv', 'tenants-list.csv');
    }
}
