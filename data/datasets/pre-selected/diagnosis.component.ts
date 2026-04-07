import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-diagnosis',
    templateUrl: './diagnosis.component.html',
    styleUrls: ['./diagnosis.component.scss']
})
export class DiagnosisComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.DIAGNOSIS,
            searchOnInit: false,
            retrieveOnInit: true,
            nextRoute: 'repairs'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            serviceOrderId: [null, [CustomValidators.required]],
            equipmentId: [null, [CustomValidators.required]],
            issueDescription: [null, [CustomValidators.required]],
            rootCause: [null, [CustomValidators.required]],
            severityLevel: ['MODERATE'],
            suggestedRepair: [null]
        });
    }

    saveOrUpdate(): void {
        this.main.spinner.start();
        super.saveOrUpdate((event) => {
            console.log('Diagnosis successfully updated/saved: ' + event);
            this.main.spinner.stop();
            this.goToPage('repairs');
        });
    }

    focusIssueDescription(): void {
        this.requestFocus();
    }
}
