import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-course',
    templateUrl: './course.component.html'
})
export class CourseComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.COURSE,
            searchOnInit: true,
            keepFilters: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [Validators.required, CustomValidators.required]],
            description: [null],
            category: [null, Validators.required],
            price: [0, [Validators.required, Validators.min(0)]],
            active: [true]
        });
    }

    override search(): void {
        this.service.clearParameter();
        if (this.v.name) {
            this.service.addParameter('name__icontains', this.v.name);
        }
        if (this.v.category) {
            this.service.addParameter('category', this.v.category);
        }
        super.search();
    }

    public archiveCourse(id: number): void {
        this.confirm('Are you sure you want to archive this course?').subscribe(res => {
            if (res) {
                this.service.patchFromDetailRoute(id, 'archive', {}).subscribe(() => {
                    this.toast.success('Success', 'Course archived successfully');
                    this.search();
                });
            }
        });
    }
}
