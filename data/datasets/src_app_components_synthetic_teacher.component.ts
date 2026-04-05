import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-teacher',
    templateUrl: './teacher.component.html'
})
export class TeacherComponent extends BaseComponent<any> implements OnInit {

    public expertiseOptions = [
        { label: 'Programming', value: 'PROG' },
        { label: 'Design', value: 'DSGN' },
        { label: 'Marketing', value: 'MKTG' },
        { label: 'Business', value: 'BIZ' }
    ];

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TEACHER,
            searchOnInit: true,
            keepFilters: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            full_name: [null, [Validators.required, CustomValidators.required]],
            email: [null, [Validators.required, Validators.email]],
            expertise: [null, Validators.required],
            hire_date: [null, Validators.required],
            bio: [null],
            is_active: [true]
        });
    }

    public toggleTeacherStatus(teacher: any): void {
        teacher.is_active = !teacher.is_active;
        this.toggle(teacher, 'is_active', () => {
            this.search();
        });
    }

    public exportToCsv(): void {
        this.service.addParameter('active', true);
        this.csvExport();
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.v.full_name) {
            this.service.addParameter('full_name__icontains', this.v.full_name);
        }
        if (this.v.expertise) {
            this.service.addParameter('expertise', this.v.expertise);
        }
        super.search();
    }
}
