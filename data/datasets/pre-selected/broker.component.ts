import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';

@Component({
    selector: 'app-broker',
    templateUrl: './broker.component.html'
})
export class BrokerComponent extends BaseComponent<any> implements OnInit {

    @Input() department: 'SALES' | 'LEASING' | 'BOTH' = 'SALES';

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.BROKER,
            searchOnInit: true,
            pageSize: 50,
            keepFilters: true
        });
    }

    override ngOnInit() {
        super.ngOnInit();
        this.f.department.setValue(this.department);
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            fullName: [null, [Validators.required, CustomValidators.required]],
            creci: [null, [Validators.required, CustomValidators.required]],
            cpf: [null, [Validators.required, CustomValidators.cpf]],
            email: [null, [Validators.required, Validators.email]],
            phone: [null, [Validators.required, CustomValidators.required]],
            department: ['SALES', [Validators.required]],
            employmentDate: [null, [Validators.required]],
            commissionPercentage: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
            isActive: [true, [Validators.required]],
            notes: [null]
        });
    }

    public registerBroker(): void {
        if (this.v.id) {
            this.saveOrUpdate();
        } else {
            this._saveOrUpdate(false, false);
        }
    }

    public toggleActive(broker: any): void {
        this.toggle(broker, 'isActive');
    }

    public showHistory(brokerId: string): void {
        this.history(brokerId);
    }

    public exportBrokerData(): void {
        this.csvExport('export-broker', `broker_data_${this.v.fullName}.csv`);
    }

    override search(restartIndex = false): void {
        this.service.clearParameter();
        if (this.v.department) this.service.addParameter('department', this.v.department);
        if (this.v.isActive !== null) this.service.addParameter('isActive', this.v.isActive);
        super.search(restartIndex);
    }
}
