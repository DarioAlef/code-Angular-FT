import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-audit',
    templateUrl: './audit.component.html'
})
export class AuditComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.AUDIT,
            searchOnInit: true,
            keepFilters: true,
            pageSize: 50
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            entityName: [null, [Validators.required]],
            actionType: [null],
            performedBy: [null],
            atStart: [null],
            atEnd: [null],
            impactLevel: [null]
        });
    }

    public search(): void {
        this.service.clearParameter();
        if (this.f.entityName.value) {
            this.service.addParameter('entity_name', this.f.entityName.value);
        }
        if (this.f.actionType.value) {
            this.service.addParameter('action_type', this.f.actionType.value);
        }
        if (this.f.performedBy.value) {
            this.service.addParameter('performed_by', this.f.performedBy.value);
        }
        if (this.f.atStart.value) {
            this.service.addParameter('timestamp__gte', this.f.atStart.value);
        }
        if (this.f.atEnd.value) {
            this.service.addParameter('timestamp__lte', this.f.atEnd.value);
        }
        if (this.f.impactLevel.value) {
            this.service.addParameter('impact_level', this.f.impactLevel.value);
        }
        super.search(true);
    }

    public viewAuditDetails(log: any): void {
        this.history(log[this.pk], 'internalTrackingId');
        this.toast.success('audit-view', 'loading-history');
    }

    public exportAuditReport(): void {
        const reportName = `audit_report_${this.f.entityName.value || 'all'}_${Date.now()}.csv`;
        this.csvExport('audit-logs/export-report/', reportName);
    }

    public clearAuditSearch(): void {
        this.formGroup.reset();
        this.search(true);
    }

}
