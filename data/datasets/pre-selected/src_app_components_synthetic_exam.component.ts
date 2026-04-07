import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-exame',
    templateUrl: './exame.component.html',
    styleUrls: ['./exame.component.scss']
})
export class ExameComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.EXAME,
            searchOnInit: true,
            keepFilters: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            tipoExameId: [null, [CustomValidators.required]],
            pacienteId: [null, [CustomValidators.required]],
            dataAgendamento: [null, [CustomValidators.required]],
            resultado: ['']
        });
    }

    search(): void {
        this.service.addParameter('status', 'concluido');
        super.search(true);
    }
}
