import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-lead',
    templateUrl: './lead.component.html',
    styleUrls: ['./lead.component.scss']
})
export class LeadComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.LEAD,
            searchOnInit: true,
            keepFilters: true,
            retrieveOnInit: true,
            retrieveIdRoute: 'id'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            firstName: [null, [CustomValidators.required]],
            lastName: [null, [CustomValidators.required]],
            email: [null, [CustomValidators.required, CustomValidators.email]],
            phone: [null],
            company: [null],
            source: ['WEB_FORM'],
            status: ['NEW', [CustomValidators.required]],
            leadScore: [0],
            tags: [null]
        });
    }

    search(): void {
        const email = this.f.email.value;
        const phone = this.f.phone.value;
        const source = this.f.source.value;

        if (email) {
            this.service.addParameter('email__icontains', email);
        }

        if (phone) {
            this.service.addParameter('phone__icontains', phone);
        }

        if (source && source !== 'ALL') {
            this.service.addParameter('source', source);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        if (this.f.email.invalid) {
            this.toast.warning('warning', 'invalid-email-format');
            return;
        }

        super.saveOrUpdate();
    }

    convertLeadToConversion(pk: number): void {
        this.confirm('Convert lead?', 'This will transfer data to a conversion record.').subscribe(confirmed => {
            if (confirmed) {
                this.service.postFromDetailRoute(pk, 'convert', {}).subscribe(() => {
                    this.toast.success('success', 'lead-converted-successfully');
                    this.goToPage('/marketing/conversions');
                });
            }
        });
    }

    addTag(newTag: string): void {
        const currentTags = this.f.tags.value || [];
        this.f.tags.setValue([...currentTags, newTag]);
        this.saveOrUpdate();
    }
}
