import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/custom-validators';

@Component({
    selector: 'app-subject',
    templateUrl: './subject.component.html'
})
export class SubjectComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.SUBJECT,
            searchOnInit: true,
            retrieveIdRoute: 'id_subject'
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            code: [null, [Validators.required, CustomValidators.required]],
            title: [null, [Validators.required, Validators.maxLength(100)]],
            description: [null],
            credits: [4, [Validators.min(1), Validators.max(12)]],
            mandatory: [true]
        });
    }

    override search(): void {
        if (this.v.code) {
            this.service.addParameter('code__startswith', this.v.code);
        }
        if (this.v.credits) {
            this.service.addParameter('credits', this.v.credits);
        }
        super.search();
    }

    duplicate(): void {
        this.service.postDetail(this.object[this.pk], 'duplicate', {})
            .subscribe(() => {
                this.toast.success('duplicated', 'subject-duplicated-successfully');
                this.goToPage('subjects');
            });
    }
}
