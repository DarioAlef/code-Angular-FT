import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { Customer } from '../../models/customer.model';

@Component({
    selector: 'app-customer',
    templateUrl: './customer.component.html'
})
export class CustomerComponent extends BaseComponent<Customer> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CUSTOMER,
            searchOnInit: false,
            keepFilters: true,
            nextRoute: '/customers'
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
        this.getBooleans();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            name: ['', [CustomValidators.required, CustomValidators.minLength(3)]],
            email: ['', [CustomValidators.required, CustomValidators.email]],
            phone: ['', [CustomValidators.required]],
            company: [''],
            active: [true],
            vip: [false],
            address: this.formBuilder.group({
                street: [''],
                city: [''],
                zipCode: ['']
            })
        });
    }

    override saveOrUpdate(): void {
        if (this.formGroup.invalid) {
            this.toast.error('Error', 'Please fill in all required fields correctly.');
            return;
        }
        super.saveOrUpdate();
    }

    resetFilters(): void {
        this.formGroup.reset({ active: true, vip: false });
        this.search(true);
    }

    exportCustomerList(): void {
        this.csvExport(URLS.CUSTOMER + '/export-csv', 'active_customers.csv');
    }
}
