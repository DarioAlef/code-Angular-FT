import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-enrollment',
    templateUrl: './enrollment.component.html'
})
export class EnrollmentComponent extends BaseComponent<any> implements OnInit {

    @Input() public courseId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.ENROLLMENT,
            searchOnInit: true,
            pageSize: 25,
            nextRoute: '/home'
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            course_id: [this.courseId, [Validators.required, CustomValidators.required]],
            student_id: [null, [Validators.required, CustomValidators.required]],
            enrollment_date: [new Date(), [Validators.required]],
            payment_status: ['PENDING', [Validators.required]],
            referral_code: [null],
            is_trial: [false]
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.courseId) {
            this.service.addParameter('course_id', this.courseId);
        }
        if (this.v.student_id) {
            this.service.addParameter('student_id', this.v.student_id);
        }
        if (this.v.payment_status) {
            this.service.addParameter('payment_status', this.v.payment_status);
        }
        super.search();
    }

    public approveEnrollment(enrollmentId: number): void {
        this.service.patchFromDetailRoute(enrollmentId, 'approve', {}).subscribe(() => {
            this.toast.success('Approved', 'Enrollment approved manually');
            this.search();
        });
    }

    public cancelEnrollment(enrollmentId: number): void {
        this.confirm('Confirm Cancellation', 'Are you sure you want to cancel this enrollment?').subscribe(res => {
            if (res) {
                this.service.postFromDetailRoute(enrollmentId, 'cancel', {}).subscribe(() => {
                    this.toast.success('Cancelled', 'Enrollment cancelled');
                    this.search();
                });
            }
        });
    }

    public bulkEnroll(students: number[], courseId: number): void {
        this.service.postFromListRoute('bulk-enroll', { students, course_id: courseId }).subscribe(() => {
            this.toast.success('Success', `${students.length} students enrolled`);
            this.search();
        });
    }
}
