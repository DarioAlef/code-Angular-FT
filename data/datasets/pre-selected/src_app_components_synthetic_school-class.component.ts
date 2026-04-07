import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/custom-validators';

@Component({
    selector: 'app-school-class',
    templateUrl: './school-class.component.html'
})
export class SchoolClassComponent extends BaseComponent<any> implements OnInit {

    @Input() currentSemester: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.SCHOOL_CLASS,
            searchOnInit: true,
            associative: true,
            associativeRoute: 'enroll_students'
        });
    }

    override ngOnInit(): void {
        if (this.currentSemester) {
            this.service.addParameter('semester', this.currentSemester);
        }
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            subject_id: [null, [Validators.required]],
            teacher_id: [null, [Validators.required]],
            semester: [null, [CustomValidators.required]],
            schedule: [null, [Validators.required]],
            capacity: [30, [Validators.min(10), Validators.max(100)]]
        });
    }

    enrollStudent(studentId: number): void {
        this.service.postDetail(this.object[this.pk], 'enroll', { student_id: studentId })
            .subscribe(() => {
                this.toast.success('enrolled', 'student-enrolled-successfully');
                this.search();
            });
    }

    override search(): void {
        this.service.clearParameter();
        if (this.v.subject_id) {
            this.service.addParameter('subject', this.v.subject_id);
        }
        if (this.v.teacher_id) {
            this.service.addParameter('teacher', this.v.teacher_id);
        }
        super.search();
    }
}
