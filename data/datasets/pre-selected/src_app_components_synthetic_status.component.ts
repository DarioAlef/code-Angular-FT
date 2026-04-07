import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { Status } from '../../models/status.model';

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html'
})
export class StatusComponent extends BaseComponent<Status> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.STATUS,
            searchOnInit: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            name: ['', [CustomValidators.required]],
            internalCode: ['', [CustomValidators.required]],
            isFinalState: [false],
            requiresFeedback: [false],
            active: [true]
        });
    }

    override saveOrUpdate(): void {
        if (this.v.isFinalState && !this.v.requiresFeedback) {
            this.confirm('This final state does not require feedback. Are you sure?', 'Status Config Check').subscribe(confirm => {
                if (confirm) super.saveOrUpdate();
            });
        } else {
            super.saveOrUpdate();
        }
    }

    toggleActive(status: Status): void {
        this.toggle(status, 'active', () => {
            this.search();
        });
    }
}
