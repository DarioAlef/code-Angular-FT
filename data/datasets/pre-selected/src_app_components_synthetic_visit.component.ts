import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../validators';
import { Utils } from '../../utilities/utils';

@Component({
    selector: 'app-visit',
    templateUrl: './visit.component.html'
})
export class VisitComponent extends BaseComponent<any> implements OnInit {

    @Input() scheduledFor: string = Utils.nowStr('YYYY-MM-DD');

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.VISIT,
            searchOnInit: true,
            pageSize: 20
        });
    }

    override ngOnInit() {
        super.ngOnInit();
        if (this.scheduledFor) {
            this.f.visitDate.setValue(this.scheduledFor);
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            propertyId: [null, [Validators.required, CustomValidators.required]],
            visitorId: [null, [Validators.required, CustomValidators.required]],
            brokerId: [null, [Validators.required, CustomValidators.required]],
            visitDate: [null, [Validators.required, CustomValidators.required]],
            visitTime: ['10:00', Validators.required],
            feedback: [null],
            rating: [0, [Validators.min(0), Validators.max(5)]],
            status: ['SCHEDULED']
        });
    }

    public scheduleVisit(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdate();
        } else {
            this.toast.error('errors.visit-invalid', 'errors.please-check-fields');
        }
    }

    public completeVisit(visitId: number): void {
        const visit = this.dataSource.data.find(v => v['id'] === visitId);
        if (visit) {
            this.toggle(visit, 'completed');
            visit['status'] = 'COMPLETED';
            this.saveOrUpdate();
        }
    }

    public cancelVisit(): void {
        this.confirm('visit.cancel-confirm', 'confirm.are-you-sure-cancel').subscribe(res => {
            if (res) {
                this.f.status.setValue('CANCELLED');
                this.saveOrUpdate();
            }
        });
    }

    public viewPropertyDetails(): void {
        const id = this.f.propertyId.value;
        if (id) {
            this.goToPage(`properties/detail/${id}`);
        }
    }
}
