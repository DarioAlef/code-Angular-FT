import { Component, Injector, Input, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { Response } from '../../models/response.model';

@Component({
    selector: 'app-response',
    templateUrl: './response.component.html'
})
export class ResponseComponent extends BaseComponent<Response> implements OnInit {

    @Input() ticketId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.RESPONSE,
            searchOnInit: false
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
        if (this.ticketId) {
            this.f['ticketId'].setValue(this.ticketId);
            this.filterByTicket();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            ticketId: [null, [CustomValidators.required]],
            content: ['', [CustomValidators.required, CustomValidators.maxLength(4000)]],
            isInternalNote: [false],
            attachmentUrl: [''],
            agentId: [null]
        });
    }

    filterByTicket(): void {
        this.service.clearParameter();
        this.service.addParameter('ticket_id', this.ticketId);
        this.search();
    }

    sendResponse(): void {
        this.f['agentId'].setValue(this.main.currentUser?.id);
        this.saveOrUpdatePlus(() => {
            this.formGroup.get('content').reset();
            this.filterByTicket();
        });
    }

    markAsInternal(): void {
        this.f['isInternalNote'].setValue(true);
        this.toast.info('Info', 'Response marked as internal note.');
    }
}
