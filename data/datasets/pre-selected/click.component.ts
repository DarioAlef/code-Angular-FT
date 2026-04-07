import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-click',
    templateUrl: './click.component.html',
    styleUrls: ['./click.component.scss']
})
export class ClickComponent extends BaseComponent<any> implements OnInit {

    @Input() targetAdId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CLICK,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: 'id',
            pageSize: 50,
            searchRoute: 'clicks-by-ad'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (this.targetAdId) {
            this.f.ad.setValue(this.targetAdId);
            this.search();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            ad: [null, [CustomValidators.required]],
            viewerId: [null, [CustomValidators.required]],
            clickDate: [new Date(), [CustomValidators.required]],
            isConversion: [false, [CustomValidators.required]],
            clickValue: [0, [CustomValidators.min(0)]],
            deviceType: ['DESKTOP', [CustomValidators.required]],
            country: ['US', [CustomValidators.required]],
            location: [null],
            os: ['WINDOWS', [CustomValidators.required]]
        });
    }

    search(): void {
        const ad = this.f.ad.value;
        const os = this.f.os.value;
        const country = this.f.country.value;

        if (ad) {
            this.service.addParameter('ad_id', ad);
        }

        if (os && os !== 'ALL') {
            this.service.addParameter('operating_system', os);
        }

        if (country) {
            this.service.addParameter('country', country);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        if (this.v.clickValue < 0) {
            this.toast.error('click-error', 'negative-click-value');
            return;
        }

        super.saveOrUpdate();
    }

    getClickPerformanceChart(pk: number): void {
        this.service.getFromDetailRoute(pk, 'performance-chart', {}).subscribe(response => {
            if (response.data) {
                this.toast.info('click-performance', `Total data points: ${response.data.length}`);
            } else {
                this.toast.warning('warning', 'no-performance-data-found');
            }
        });
    }

    exportClicksCSV(): void {
        const adId = this.f.ad.value;
        const filename = adId ? `clicks_ad_${adId}.csv` : 'clicks_report.csv';
        this.csvExport('export-clicks', filename);
    }

    markAsConversion(pk: number): void {
        this.service.patchFromDetailRoute(pk, 'mark-as-conversion', { converted: true }).subscribe(() => {
            this.toast.success('success', 'click-marked-as-conversion');
            this.search();
        });
    }

    getClickCountByDeviceType(deviceType: string): void {
        this.service.getFromListRoute('count-by-device', { device_type: deviceType }).subscribe(response => {
            this.toast.info('click-total', `Total clicks for ${deviceType}: ${response.total}`);
        });
    }
}
