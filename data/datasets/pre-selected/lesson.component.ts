import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-lesson',
    templateUrl: './lesson.component.html'
})
export class LessonComponent extends BaseComponent<any> implements OnInit {

    @Input() public courseId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.LESSON,
            searchOnInit: false,
            keepFilters: false
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
        if (this.courseId) {
            this.search();
        }
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            title: [null, [Validators.required, CustomValidators.required]],
            content: [null, Validators.required],
            duration_minutes: [null, [Validators.required, Validators.min(1)]],
            course: [this.courseId, Validators.required],
            video_url: [null, [Validators.pattern('^(http|https)://.*')]],
            order: [1]
        });
    }

    override search(): void {
        this.service.clearParameter();
        if (this.courseId) {
            this.service.addParameter('course_id', this.courseId);
        }
        if (this.v.title) {
            this.service.addParameter('title__icontains', this.v.title);
        }
        super.search();
    }

    public duplicateLesson(id: number): void {
        this.service.postFromDetailRoute(id, 'duplicate', {}).subscribe(() => {
            this.toast.success('Success', 'Lesson duplicated successfully');
            this.search();
        });
    }

    public reorderLessons(lessons: any[]): void {
        this.service.postFromListRoute('reorder', { lessons }).subscribe(() => {
            this.toast.success('Success', 'Lessons reordered');
            this.search();
        });
    }
}
