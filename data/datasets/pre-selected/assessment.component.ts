import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-assessment',
    templateUrl: './assessment.component.html'
})
export class AssessmentComponent extends BaseComponent<any> implements OnInit {

    @Input() public lessonId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.ASSESSMENT,
            searchOnInit: true,
            pageSize: 10,
            keepFilters: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            student_id: [null, [Validators.required, CustomValidators.required]],
            lesson_id: [this.lessonId, [Validators.required, CustomValidators.required]],
            score: [null, [Validators.required, Validators.min(0), Validators.max(10)]],
            comment: [null, [Validators.maxLength(1000)]],
            submitted_date: [new Date(), Validators.required],
            is_graded: [false]
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.lessonId) {
            this.service.addParameter('lesson_id', this.lessonId);
        }
        if (this.v.student_id) {
            this.service.addParameter('student_id', this.v.student_id);
        }
        if (this.v.score) {
            this.service.addParameter('score', this.v.score);
        }
        super.search();
    }

    public gradeSubmission(assessmentId: number, grade: number): void {
        this.service.patchFromDetailRoute(assessmentId, 'grade', { score: grade }).subscribe(() => {
            this.toast.success('Graded', 'Submission graded successfully');
            this.search();
        });
    }

    public downloadSubmission(assessmentId: number): void {
        this.service.loadFile(`${assessmentId}/download/`, {}).subscribe(file => {
            this.toast.success('Success', 'File downloaded');
        });
    }

    public requestRevision(assessmentId: number, comment: string): void {
        this.service.postFromDetailRoute(assessmentId, 'revision', { comment }).subscribe(() => {
            this.toast.success('Requested', 'Revision requested from student');
            this.search();
        });
    }
}
