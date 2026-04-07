import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../app/app.urls';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-return',
    templateUrl: './return.component.html'
})
export class ReturnComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.RETURN,
            retrieveOnInit: false,
            nextRoute: 'dashboard/logistics/returns'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            orderId: [null, [CustomValidators.required]],
            reason: [null, [CustomValidators.required]],
            status: ['REQUESTED'],
            photos: [[]],
            refundAmount: [0],
            receivedAt: [null]
        });
    }

    public processReturn(): void {
        this.saveOrUpdateFormData(event => {
            this.toast.success('return-processed', 'confirmation-sent');
        });
    }

    public approveReturn(pk: number): void {
        this.service.patchFromDetailRoute(pk, 'approve', {}).subscribe(() => {
            this.search();
        });
    }
}
