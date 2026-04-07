import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-campaign',
    templateUrl: './campaign.component.html',
    styleUrls: ['./campaign.component.scss']
})
export class CampaignComponent extends BaseComponent<any> implements OnInit {

    @Input() campaignType: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CAMPAIGN,
            searchOnInit: true,
            keepFilters: true,
            nextRoute: '/marketing/campaigns'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        if (this.campaignType) {
            this.f.type.setValue(this.campaignType);
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required]],
            type: [null, [CustomValidators.required]],
            startDate: [null, [CustomValidators.required]],
            endDate: [null],
            budget: [0, [CustomValidators.required, CustomValidators.min(0)]],
            status: ['DRAFT', [CustomValidators.required]],
            description: [null]
        });
    }

    search(): void {
        const name = this.f.name.value;
        const status = this.f.status.value;

        if (name) {
            this.service.addParameter('name__icontains', name);
        }

        if (status && status !== 'ALL') {
            this.service.addParameter('status', status);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        if (this.formGroup.valid) {
            super.saveOrUpdate();
        } else {
            this.toast.error('form-error', 'check-required-fields');
            this.formGroup.markAllAsTouched();
        }
    }

    duplicateCampaign(): void {
        const data = this.rv;
        delete data.id;
        data.name = `${data.name} (Copy)`;
        this.service.save(data).subscribe(() => {
            this.toast.success('success', 'campaign-duplicated');
            this.search();
        });
    }
}
