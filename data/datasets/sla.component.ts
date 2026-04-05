import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { SLA } from '../../models/sla.model';

@Component({
    selector: 'app-sla',
    templateUrl: './sla.component.html'
})
export class SLAComponent extends BaseComponent<SLA> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.SLA,
            searchOnInit: true,
            nextRouteUpdate: '/sla/manage'
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
        this.handleBusinessHours();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            title: ['', [CustomValidators.required]],
            type: ['standard', [CustomValidators.required]],
            gracePeriodMinutes: [0],
            startTime: ['08:00', [CustomValidators.required]],
            endTime: ['18:00', [CustomValidators.required]],
            applyWeekends: [false],
            active: [true]
        });
    }

    handleBusinessHours(): void {
        this.formGroup.get('applyWeekends').valueChanges.subscribe(apply => {
            if (apply) {
                this.enableControls('startTime', 'endTime');
            } else {
                this.disableControls('startTime', 'endTime');
            }
        });
    }

    duplicateSLA(id: number): void {
        this.service.postFromDetailRoute(id, 'duplicate', {})
            .subscribe(res => {
                this.toast.success('Success', 'SLA duplicated.');
                this.search();
            });
    }

    override search(restartIndex = false): void {
        this.service.clearParameter();
        this.service.addParameter('active', this.v.active);
        if (this.v.type !== 'all') {
            this.service.addParameter('type', this.v.type);
        }
        super.search(restartIndex);
    }
}
