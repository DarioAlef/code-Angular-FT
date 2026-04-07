import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.scss']
})
export class ReportComponent extends BaseComponent<any> implements OnInit {

    @Input() reportType: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.REPORT,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: 'id',
            pageSize: 10,
            keepFilters: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (this.reportType) {
            this.f.type.setValue(this.reportType);
            this.search();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required]],
            type: ['CAMPAIGN_PERFORMANCE', [CustomValidators.required]],
            startDate: [new Date(), [CustomValidators.required]],
            endDate: [new Date(), [CustomValidators.required]],
            campaigns: [[]],
            ads: [[]],
            channels: [[]],
            format: ['PDF', [CustomValidators.required]],
            includeImpressions: [true],
            includeClicks: [true],
            includeConversions: [true],
            isScheduled: [false],
            scheduleFrequency: ['WEEKLY']
        });
    }

    search(): void {
        const name = this.f.name.value;
        const type = this.f.type.value;
        const start = this.f.startDate.value;
        const end = this.f.endDate.value;

        if (name) {
            this.service.addParameter('report_name__icontains', name);
        }

        if (type && type !== 'ALL') {
            this.service.addParameter('report_type', type);
        }

        if (start) {
            this.service.addParameter('date_after', start.toISOString().split('T')[0]);
        }

        if (end) {
            this.service.addParameter('date_before', end.toISOString().split('T')[0]);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        const start = new Date(this.f.startDate.value);
        const end = new Date(this.f.endDate.value);

        if (start > end) {
            this.toast.error('report-error', 'start-date-after-end-date');
            return;
        }

        super.saveOrUpdate();
    }

    generateReport(pk: number): void {
        this.service.postFromDetailRoute(pk, 'generate', {}).subscribe(response => {
            if (response.success) {
                this.toast.success('generation-success', 'report-link-sent-to-email');
                this.search();
            } else {
                this.toast.error('generation-failed', 'error-generating-report-please-try-later');
            }
        });
    }

    downloadReport(pk: number, format: string): void {
        const filename = `report_${pk}.${format.toLowerCase()}`;
        this.csvExport(`download-report/${format}`, filename);
    }

    getEmailReportSettings(pk: number): void {
        this.service.getFromDetailRoute(pk, 'email-settings', {}).subscribe(response => {
            this.toast.info('email-settings', `Recipient: ${response.recipientEmail}`);
        });
    }

    updateReportSchedule(pk: number, scheduled: boolean): void {
        this.service.patchFromDetailRoute(pk, 'update-schedule', { is_scheduled: scheduled }).subscribe(() => {
            this.toast.success('success', scheduled ? 'report-scheduled-successfully' : 'report-schedule-cancelled');
            this.search();
        });
    }

    deleteReport(pk: number, name: string): void {
        this.confirm(name, `Delete permanentely report ${name}?`).subscribe(confirmed => {
            if (confirmed) {
                super.delete(pk, name);
            }
        });
    }
}
