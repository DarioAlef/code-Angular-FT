import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-plantao',
    templateUrl: './plantao.component.html',
    styleUrls: ['./plantao.component.scss']
})
export class PlantaoComponent extends BaseComponent<any> implements OnInit {

    @Input() unidadeId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PLANTAO,
            searchOnInit: false,
            associative: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            medicoId: [null, [CustomValidators.required]],
            dataInicio: [null, [CustomValidators.required]],
            dataFim: [null, [CustomValidators.required]],
            valorAdicional: [0]
        });
    }

    saveOrUpdate(): void {
        this.formGroup.get('unidadeId')?.setValue(this.unidadeId);
        super.saveOrUpdate();
    }
}
