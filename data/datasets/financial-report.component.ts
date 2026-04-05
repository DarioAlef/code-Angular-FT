import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-financial-report',
    templateUrl: './financial-report.component.html',
    styleUrls: ['./financial-report.component.scss']
})
export class FinancialReportComponent extends BaseComponent<any> implements OnInit {

    @Input() reportType: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.FINANCIAL_REPORT,
            searchOnInit: false
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            startDate: [null, [CustomValidators.required]],
            endDate: [null, [CustomValidators.required]],
            format: ['PDF', [CustomValidators.required]],
            includeDrafts: [false]
        });
    }

    search(): void {
        if (this.reportType) {
            this.service.addParameter('type', this.reportType);
        }
        super.search();
    }
}
