import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-conversion',
    templateUrl: './conversion.component.html',
    styleUrls: ['./conversion.component.scss']
})
export class ConversionComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CONVERSION,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: 'id',
            pageSize: 50
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            lead: [null, [CustomValidators.required]],
            campaign: [null, [CustomValidators.required]],
            value: [0, [CustomValidators.required, CustomValidators.min(0)]],
            conversionDate: [new Date(), [CustomValidators.required]],
            conversionType: ['SALE', [CustomValidators.required]],
            product: [null],
            source: ['DIRECT'],
            metadata: [null]
        });
    }

    search(): void {
        const lead = this.f.lead.value;
        const campaign = this.f.campaign.value;
        const type = this.f.conversionType.value;

        if (lead) {
            this.service.addParameter('lead', lead);
        }

        if (campaign) {
            this.service.addParameter('campaign', campaign);
        }

        if (type && type !== 'ALL') {
            this.service.addParameter('type', type);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        if (this.v.value < 0) {
            this.toast.error('error', 'negative-conversion-value');
            return;
        }

        super.saveOrUpdate();
    }

    exportConversionsCSV(): void {
        const campaignId = this.f.campaign.value;
        const filename = campaignId ? `conversions_campaign_${campaignId}.csv` : 'conversions_report.csv';
        this.csvExport('export-csv', filename);
    }

    viewLeadDetails(leadId: number): void {
        this.goToPage(`/marketing/leads/${leadId}`);
    }

    getDailyTotal(date = new Date()): void {
        this.service.getFromListRoute('daily-conversion-total', { date: date.toISOString().split('T')[0] })
            .subscribe(response => {
                this.toast.info('daily-total', `Total value is $${response.total}`);
            });
    }
}
