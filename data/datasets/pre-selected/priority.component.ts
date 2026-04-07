import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { Priority } from '../../models/priority.model';

@Component({
    selector: 'app-priority',
    templateUrl: './priority.component.html'
})
export class PriorityComponent extends BaseComponent<Priority> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PRIORITY,
            searchOnInit: true,
            retrieveOnInit: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            label: ['', [CustomValidators.required]],
            weight: [0, [CustomValidators.required]],
            responseTimeHours: [24, [CustomValidators.required]],
            resolutionTimeHours: [48, [CustomValidators.required]],
            icon: ['priority_high']
        });
    }

    savePriority(): void {
        if (this.f['weight'].value > 100) {
            this.toast.warning('Warning', 'Weight value is very high.');
        }
        this.saveOrUpdate();
    }

    copyPrioritySettings(targetId: number): void {
        this.service.postFromDetailRoute(this.v.id, 'copy-settings', { target_id: targetId })
            .subscribe(() => {
                this.toast.success('Success', 'Settings copied successfully.');
                this.search();
            });
    }
}
