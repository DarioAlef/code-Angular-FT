import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html'
})
export class UserComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.USER,
            searchOnInit: true,
            keepFilters: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required]],
            email: [null, [CustomValidators.required, Validators.email]],
            isActive: [true],
            role: [null, [Validators.required]]
        });
    }

    public search(): void {
        this.service.clearParameter();
        if (this.f.name.value) {
            this.service.addParameter('name__icontains', this.f.name.value);
        }
        if (this.f.role.value) {
            this.service.addParameter('role', this.f.role.value);
        }
        super.search(true);
    }

    public save(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdate();
        } else {
            this.toast.error('error-title', 'invalid-form');
        }
    }

    public exportUsers(): void {
        this.csvExport('export-users', 'active-users-list.csv');
    }

}
