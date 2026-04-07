import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/custom-validators';

@Component({
    selector: 'app-attendance',
    templateUrl: './attendance.component.html'
})
export class AttendanceComponent extends BaseComponent<any> implements OnInit {

    @Input() schoolClassId: number;
    @Input() lectureDate: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.ATTENDANCE,
            searchOnInit: true,
            retrieveOnInit: false,
            pageSize: 50
        });
    }

    override ngOnInit(): void {
        if (this.schoolClassId) {
            this.service.addParameter('school_class', this.schoolClassId);
        }
        if (this.lectureDate) {
            this.service.addParameter('date', this.lectureDate);
        }
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            enrollment_id: [null, [Validators.required]],
            date: [new Date(), [Validators.required, CustomValidators.required]],
            present: [true, [Validators.required]],
            justification: [null]
        });
    }

    bulkUpdate(attendances: any[]): void {
        this.service.postListRoute('bulk_update', { attendances: attendances })
            .subscribe(() => {
                this.toast.success('updated', 'attendance-bulk-updated-successfully');
                this.search();
            });
    }

    override search(): void {
        this.service.clearParameter();
        if (this.v.enrollment_id) {
            this.service.addParameter('enrollment', this.v.enrollment_id);
        }
        if (this.v.present !== null) {
            this.service.addParameter('present', this.v.present);
        }
        super.search();
    }
}
