import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-progress',
    templateUrl: './progress.component.html'
})
export class ProgressComponent extends BaseComponent<any> implements OnInit {

    @Input() public enrollmentId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PROGRESS,
            searchOnInit: true,
            pageSize: 50
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            enrollment_id: [this.enrollmentId, [Validators.required, CustomValidators.required]],
            lesson_id: [null, [Validators.required, CustomValidators.required]],
            student_id: [null, [Validators.required]],
            percentage_completed: [0, [Validators.min(0), Validators.max(100), Validators.required]],
            last_accessed: [new Date(), [Validators.required]],
            is_completed: [false]
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.enrollmentId) {
            this.service.addParameter('enrollment_id', this.enrollmentId);
        }
        if (this.v.lesson_id) {
            this.service.addParameter('lesson_id', this.v.lesson_id);
        }
        super.search();
    }

    public updateProgress(progressId: number, percentage: number): void {
        this.service.patchFromDetailRoute(progressId, 'update-percentage', { percentage }).subscribe(() => {
            this.toast.success('Updated', 'Progress updated successfully');
            this.search();
        });
    }

    public markAsCompleted(progressId: number): void {
        this.service.patchFromDetailRoute(progressId, 'complete', {}).subscribe(() => {
            this.toast.success('Done', 'Lesson marked as completed');
            this.search();
        });
    }

    public resetProgress(enrollmentId: number): void {
        this.confirm('Warning', 'Reset all progress for this course?').subscribe(res => {
            if (res) {
                this.service.postFromListRoute('reset', { enrollment_id: enrollmentId }).subscribe(() => {
                    this.toast.success('Reset', 'Progress cleared');
                    this.search();
                });
            }
        });
    }
}
