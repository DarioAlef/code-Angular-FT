import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';

@Component({
    selector: 'app-condominium',
    templateUrl: './condominium.component.html'
})
export class CondominiumComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CONDOMINIUM,
            searchOnInit: true,
            retrieveOnInit: true,
            pageSize: 10,
            keepFilters: true
        });
    }

    override ngOnInit() {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            name: [null, [Validators.required, CustomValidators.required]],
            cnpj: [null, [Validators.required, CustomValidators.cnpj]],
            managerName: [null, [Validators.required, CustomValidators.required]],
            managerPhone: [null, [Validators.required, CustomValidators.required]],
            units: [0, [Validators.required, Validators.min(1)]],
            fee: [0, [Validators.required, Validators.min(0)]],
            reserveFund: [0, [Validators.required, Validators.min(0)]],
            reserveFundPercentage: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
            bankId: [null],
            accountNumber: [null],
            status: ['ACTIVE']
        });
    }

    public recalculateFee(increase: number): void {
        const currentFee = this.f.fee.value;
        if (currentFee) {
            const calculated = currentFee * (1 + increase / 100);
            this.f.fee.setValue(calculated);
        }
    }

    public updateManager(manager: any): void {
        this.confirm('manager.update-confirm').subscribe(res => {
            if (res) {
                this.f.managerName.setValue(manager.name);
                this.f.managerPhone.setValue(manager.phone);
                this.saveOrUpdate();
            }
        });
    }

    public suspendCondominium(): void {
        this.confirm('condo.suspend-confirm', 'confirm.suspend').subscribe(res => {
            if (res) {
                this.f.status.setValue('SUSPENDED');
                this.saveOrUpdate();
            }
        });
    }

    public exportCondoData(): void {
        this.csvExport('export-condo', 'condominium_list.csv');
    }

    override search(): void {
        this.service.clearParameter();
        if (this.v.name) this.service.addParameter('name_icontains', this.v.name);
        if (this.v.status) this.service.addParameter('status', this.v.status);
        super.search();
    }
}
