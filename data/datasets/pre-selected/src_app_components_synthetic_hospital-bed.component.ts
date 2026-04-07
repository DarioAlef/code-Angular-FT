import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-leito',
    templateUrl: './leito.component.html',
    styleUrls: ['./leito.component.scss']
})
export class LeitoComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.LEITO,
            searchOnInit: false,
            pageSize: 20
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            numero: ['', [CustomValidators.required]],
            asa: ['', [CustomValidators.required]],
            tipoLeito: [null, [CustomValidators.required]],
            ocupado: [false]
        });
    }

    search(): void {
        this.service.addParameter('disponibilidade', 'true');
        super.search(true);
    }
}
