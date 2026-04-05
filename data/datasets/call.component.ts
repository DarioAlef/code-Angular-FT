import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-call',
    templateUrl: './call.component.html',
    styleUrls: ['./call.component.scss']
})
export class CallComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CALL,
            searchOnInit: true,
            nextRouteUpdate: 'active-calls'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            subject: [null, [CustomValidators.required]],
            requesterName: [null, [CustomValidators.required]],
            contactInfo: [null, [CustomValidators.required]],
            category: ['HARDWARE', [CustomValidators.required]],
            urgencyLevel: ['LOW', [CustomValidators.required]],
            openingDate: [new Date()],
            closingDate: [null]
        });
    }

    search(): void {
        const urgency = this.f.urgencyLevel.value;
        if (urgency && urgency !== 'LOW') {
            this.service.addParameter('priority', 'HIGH');
        }
        super.search(false);
    }

    resolveCall(): void {
        this.formGroup.patchValue({ closingDate: new Date() });
        this.saveOrUpdatePlus((evt) => {
            this.toast.success('resolved', 'call-closed-successfully');
            this.goToPage('dashboard');
        });
    }

    deleteCall(id: number): void {
        this.delete(id, 'Call Subject: ' + this.formGroup.value.subject);
    }
}
