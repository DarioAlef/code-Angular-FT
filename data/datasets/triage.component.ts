import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-triagem',
    templateUrl: './triagem.component.html',
    styleUrls: ['./triagem.component.scss']
})
export class TriagemComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TRIAGEM,
            searchOnInit: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            pacienteId: [null, [CustomValidators.required]],
            pressaoArterial: ['', [CustomValidators.required]],
            temperatura: [null, [CustomValidators.required]],
            prioridade: ['viva', [CustomValidators.required]]
        });
    }

    search(): void {
        this.service.addParameter('urgencia', 'alta');
        this.service.addParameter('pendente', 'true');
        super.search();
    }
}
