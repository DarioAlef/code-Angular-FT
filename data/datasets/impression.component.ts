import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-impression',
    templateUrl: './impression.component.html',
    styleUrls: ['./impression.component.scss']
})
export class ImpressionComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.IMPRESSION,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: 'id',
            pageSize: 100,
            searchRoute: 'search-impressions'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            ad: [null, [CustomValidators.required]],
            viewerId: [null, [CustomValidators.required]],
            impressionDate: [new Date(), [CustomValidators.required]],
            isViewed: [false, [CustomValidators.required]],
            viewDuration: [0, [CustomValidators.min(0)]],
            deviceType: ['MOBILE', [CustomValidators.required]],
            country: ['BR', [CustomValidators.required]],
            location: [null],
            os: ['ANDROID', [CustomValidators.required]]
        });
    }

    search(): void {
        const ad = this.f.ad.value;
        const device = this.f.deviceType.value;
        const country = this.f.country.value;

        if (ad) {
            this.service.addParameter('ad', ad);
        }

        if (device && device !== 'ALL') {
            this.service.addParameter('device_type', device);
        }

        if (country) {
            this.service.addParameter('country', country);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        const duration = this.f.viewDuration.value || 0;
        if (duration < 0) {
            this.toast.error('impression-error', 'duration-cannot-be-negative');
            return;
        }

        super.saveOrUpdate();
    }

    getAdImpressionHeatmap(pk: number): void {
        this.service.getFromDetailRoute(pk, 'heatmap', {}).subscribe(response => {
            this.toast.info('impression-heatmap', `Impression coordinates: ${response.coordinates}`);
        });
    }

    exportImpressionsByCountry(countryCode: string): void {
        this.csvExport(`export-impressions/${countryCode}`, `impressions_${countryCode}.csv`);
    }

    countImpressionsByAdId(adId: number): void {
        this.service.getFromListRoute('count-impressions', { ad_id: adId }).subscribe(response => {
            this.toast.info('impression-total', `Total impressions for ad #${adId}: ${response.total}`);
        });
    }

    deleteOldImpressions(): void {
        this.confirm('Cleanup old impressions?', 'This will permanently remove logs older than 90 days.').subscribe(confirmed => {
            if (confirmed) {
                this.service.deleteFromListRoute('cleanup-logs', { days_old: 90 }).subscribe(() => {
                    this.toast.success('success', 'cleanup-log-complete');
                    this.search();
                });
            }
        });
    }
}
