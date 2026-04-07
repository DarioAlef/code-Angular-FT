import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-permission',
    templateUrl: './permission.component.html'
})
export class PermissionComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PERMISSION,
            searchOnInit: false,
            retrieveOnInit: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            code: [null, [Validators.required, Validators.maxLength(50)]],
            label: [null, [Validators.required]],
            module: [null, [Validators.required]],
            isSystem: [false]
        });
    }

    public search(): void {
        if (this.f.code.value) {
            this.service.addParameter('code', this.f.code.value);
        }
        if (this.f.module.value) {
            this.service.addParameter('module', this.f.module.value);
        }
        super.search();
    }

    public saveAndCreateAnother(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdatePlus();
        }
    }

    public deletePermission(id: number, code: string): void {
        this.delete(id, code);
    }

}
