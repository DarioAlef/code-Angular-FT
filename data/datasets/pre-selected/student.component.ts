import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-student',
    templateUrl: './student.component.html'
})
export class StudentComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.STUDENT,
            searchOnInit: true,
            keepFilters: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [Validators.required, CustomValidators.required, Validators.minLength(3)]],
            email: [null, [Validators.required, Validators.email]],
            registration_number: [null, [Validators.required, CustomValidators.required]],
            birth_date: [null],
            status: [true],
            phone_number: [null, [Validators.pattern('^\\+?[1-9]\\d{1,14}$')]]
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.v.name) {
            this.service.addParameter('name__icontains', this.v.name);
        }
        if (this.v.registration_number) {
            this.service.addParameter('registration_number', this.v.registration_number);
        }
        if (this.v.status !== null) {
            this.service.addParameter('is_active', this.v.status);
        }
        super.search();
    }

    public resetPassword(studentId: number): void {
        this.service.postFromDetailRoute(studentId, 'reset-password', {}).subscribe(() => {
            this.toast.success('Success', 'Password reset instructions sent');
        });
    }

    public exportActiveStudents(): void {
        this.service.clearParameter();
        this.service.addParameter('status', 'ACTIVE');
        this.csvExport('export-active', 'active_students.csv');
    }

    public importStudentsLegacy(file: File): void {
        const formData = new FormData();
        formData.append('file', file);
        this.service.postFromListRoute('import-legacy', formData).subscribe(() => {
            this.toast.success('Import', 'Students imported from legacy system');
            this.search();
        });
    }
}
