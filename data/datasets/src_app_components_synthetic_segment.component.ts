import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-segment',
    templateUrl: './segment.component.html',
    styleUrls: ['./segment.component.scss']
})
export class SegmentComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.SEGMENT,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: 'id',
            keepFilters: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required]],
            criteria: [null, [CustomValidators.required]],
            description: [null],
            isActive: [true, [CustomValidators.required]],
            parentSegment: [null],
            targetAudienceSize: [0],
            tags: [null]
        });
    }

    search(): void {
        const name = this.f.name.value;
        const isActive = this.f.isActive.value;

        if (name) {
            this.service.addParameter('name__icontains', name);
        }

        if (isActive !== null && isActive !== undefined) {
            this.service.addParameter('is_active', isActive);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        if (this.f.parentSegment.value === this.object[this.pk]) {
            this.toast.error('circular-parenting', 'cannot-be-own-parent');
            return;
        }

        super.saveOrUpdate();
    }

    calculateAudienceSize(pk: number): void {
        this.service.getFromDetailRoute(pk, 'count-audience', {})
            .subscribe(response => {
                this.f.targetAudienceSize.setValue(response.count);
                this.toast.info('audience-recalculated', `New size: ${response.count}`);
            });
    }

    reconfigureCriteria(newCriteria: string): void {
        this.f.criteria.setValue(newCriteria);
        this.saveOrUpdate();
    }

    showSegmentAnalytics(pk: number): void {
        this.goToPage(`/marketing/segments/${pk}/analytics`);
    }

    duplicateSegment(pk: number): void {
        this.service.postFromDetailRoute(pk, 'duplicate', {}).subscribe(() => {
            this.toast.success('success', 'segment-duplicated');
            this.search();
        });
    }
}
