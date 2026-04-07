import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-learning-module',
    templateUrl: './learning-module.component.html'
})
export class LearningModuleComponent extends BaseComponent<any> implements OnInit {

    @Input() public courseId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.MODULE,
            searchOnInit: true,
            keepFilters: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            course_id: [this.courseId, [Validators.required, CustomValidators.required]],
            name: [null, [Validators.required, CustomValidators.required]],
            order: [1, [Validators.required, Validators.min(1)]],
            description: [null],
            locked: [false],
            min_score_required: [0, [Validators.min(0), Validators.max(100)]]
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.courseId) {
            this.service.addParameter('course_id', this.courseId);
        }
        if (this.v.name) {
            this.service.addParameter('name__icontains', this.v.name);
        }
        super.search();
    }

    public lockModule(id: number): void {
        this.service.patchFromDetailRoute(id, 'lock', { locked: true }).subscribe(() => {
            this.toast.success('Locked', 'Module locked successfully');
            this.search();
        });
    }

    public unlockModule(id: number): void {
        this.service.patchFromDetailRoute(id, 'unlock', { locked: false }).subscribe(() => {
            this.toast.success('Unlocked', 'Module unlocked successfully');
            this.search();
        });
    }

    public cloneModule(id: number, targetCourseId: number): void {
        this.service.postFromDetailRoute(id, 'clone', { target_course_id: targetCourseId }).subscribe(() => {
            this.toast.success('Cloned', 'Module cloned to target course');
            this.search();
        });
    }
}
