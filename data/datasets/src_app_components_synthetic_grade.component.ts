import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/custom-validators';

@Component({
    selector: 'app-grade',
    templateUrl: './grade.component.html'
})
export class GradeComponent extends BaseComponent<any> implements OnInit {

    @Input() enrollmentId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.GRADE,
            searchOnInit: true,
            retrieveOnInit: false
        });
    }

    override ngOnInit(): void {
        if (this.enrollmentId) {
            this.service.addParameter('enrollment', this.enrollmentId);
        }
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            enrollment_id: [null, [Validators.required]],
            value: [0.0, [Validators.required, Validators.min(0), Validators.max(10), CustomValidators.required]],
            assessment_type: ['EXAM', [Validators.required]],
            weight: [1.0, [Validators.required]],
            remarks: [null]
        });
    }

    override search(): void {
        if (this.v.assessment_type) {
            this.service.addParameter('type', this.v.assessment_type);
        }
        if (this.v.value) {
            this.service.addParameter('value__gte', this.v.value);
        }
        super.search();
    }

    saveGrade(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdateFormDataPlus();
            this.toast.success('saved', 'grade-saved-successfully');
        } else {
            this.toast.error('invalid', 'invalid-grade-data');
        }
    }
}
