import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-cirurgia',
    templateUrl: './cirurgia.component.html',
    styleUrls: ['./cirurgia.component.scss']
})
export class CirurgiaComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CIRURGIA,
            searchOnInit: true,
            associative: true,
            associativeRoute: 'v1/cirurgias/associar'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            pacienteId: [null, [CustomValidators.required]],
            medicoResponsavelId: [null, [CustomValidators.required]],
            salaId: [null, [CustomValidators.required]],
            dataHora: [null, [CustomValidators.required]],
            custoEstimado: [0]
        });
    }

    search(): void {
        this.service.addParameter('completa', 'false');
        super.search(true);
    }
}
