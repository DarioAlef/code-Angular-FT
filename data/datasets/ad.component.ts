import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-ad',
    templateUrl: './ad.component.html',
    styleUrls: ['./ad.component.scss']
})
export class AdComponent extends BaseComponent<any> implements OnInit {

    @Input() campaignId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.AD,
            searchOnInit: false,
            noResponse: false,
            pageSize: 25
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (this.campaignId) {
            this.service.addParameter('campaign', this.campaignId);
            this.search();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            title: [null, [CustomValidators.required]],
            content: [null, [CustomValidators.required]],
            adType: ['BANNER', [CustomValidators.required]],
            campaign: [null, [CustomValidators.required]],
            ctaText: ['Learn More'],
            imageUrl: [null],
            targetUrl: [null, [CustomValidators.required]],
            isPromoted: [false]
        });
    }

    search(): void {
        const type = this.f.adType.value;
        const title = this.f.title.value;

        if (type) {
            this.service.addParameter('type', type);
        }

        if (title) {
            this.service.addParameter('title__icontains', title);
        }

        super.search(true);
    }

    previewAd(): void {
        const content = this.rv;
        if (this.formGroup.valid) {
            this.dialog.open(AdComponent, {
                width: '500px',
                data: { preview: true, ad: content }
            });
        }
    }

    updateStatus(newStatus: string): void {
        this.f.status.setValue(newStatus);
        super.saveOrUpdate();
    }

    deleteAd(pk: number, title: string): void {
        this.confirm(title, 'Confirm ad deletion?').subscribe(confirmed => {
            if (confirmed) {
                super.delete(pk, title);
            }
        });
    }
}
