import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-medico',
    templateUrl: './medico.component.html',
    styleUrls: ['./medico.component.scss']
})
export class MedicoComponent extends BaseComponent<any> implements OnInit {

    @Input() especialidadeId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.MEDICO,
            searchOnInit: false
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (this.especialidadeId) {
            this.search();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            nome: ['', [CustomValidators.required]],
            crm: ['', [CustomValidators.required]],
            email: ['', [CustomValidators.email]],
            telefone: ['']
        });
    }

    search(): void {
        if (this.especialidadeId) {
            this.service.addParameter('especialidade', this.especialidadeId);
        }
        super.search(true);
    }
}
