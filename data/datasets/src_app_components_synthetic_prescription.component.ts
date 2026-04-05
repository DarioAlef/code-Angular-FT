import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-receita',
    templateUrl: './receita.component.html',
    styleUrls: ['./receita.component.scss']
})
export class ReceitaComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.RECEITA,
            searchOnInit: true,
            nextRoute: '/financeiro/faturas'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            pacienteId: [null, [CustomValidators.required]],
            valorTotal: [0, [CustomValidators.required]],
            dataEmissao: [new Date(), [CustomValidators.required]],
            observacao: ['']
        });
    }

    saveOrUpdate(): void {
        // Logica customizada antes de salvar
        console.log('Validando receita antes de salvar...');
        super.saveOrUpdate();
    }
}
