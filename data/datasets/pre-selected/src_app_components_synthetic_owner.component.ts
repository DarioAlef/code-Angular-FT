import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';

@Component({
    selector: 'app-owner',
    templateUrl: './owner.component.html'
})
export class OwnerComponent extends BaseComponent<any> implements OnInit {

    @Input() type: 'NATURAL' | 'LEGAL' = 'NATURAL';

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.OWNER,
            searchOnInit: false,
            associative: true
        });
    }

    override ngOnInit() {
        super.ngOnInit();
        if (this.type === 'LEGAL') {
            this.f.taxId.setValidators([Validators.required, CustomValidators.cnpj]);
        } else {
            this.f.taxId.setValidators([Validators.required, CustomValidators.cpf]);
        }
        this.f.taxId.updateValueAndValidity();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            name: [null, [Validators.required, Validators.minLength(3)]],
            email: [null, [Validators.required, Validators.email]],
            phone: [null, Validators.required],
            taxId: [null, Validators.required],
            address: [null],
            notes: [null]
        });
    }

    public registerOwner(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdate();
        } else {
            this.toast.error('errors.invalid-form', 'errors.please-check-fields');
        }
    }

    public resetForm(): void {
        this.formGroup.reset();
        this._changeToCreateMode();
    }
}
