import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-ambulancia',
    templateUrl: './ambulancia.component.html',
    styleUrls: ['./ambulancia.component.scss']
})
export class AmbulanciaComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.AMBULANCIA,
            searchOnInit: true,
            keepFilters: false
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            placa: ['', [CustomValidators.required, CustomValidators.minLength(7)]],
            modelo: ['', [CustomValidators.required]],
            ano: [null, [CustomValidators.required]],
            disponivel: [true]
        });
    }

    saveOrUpdate(): void {
        if (this.formGroup.valid) {
            super.saveOrUpdate();
        } else {
            this.toast.error('erro', 'formulario-invalido');
        }
    }
}
