import { Component, Injector, Input, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { Ticket } from '../../models/ticket.model';

@Component({
    selector: 'app-ticket',
    templateUrl: './ticket.component.html'
})
export class TicketComponent extends BaseComponent<Ticket> implements OnInit {

    @Input() customerId: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TICKET,
            searchOnInit: true,
            keepFilters: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
        if (this.customerId) {
            this.f['customerId'].setValue(this.customerId);
            this.search();
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            subject: ['', [CustomValidators.required]],
            description: ['', [CustomValidators.required]],
            customerId: [null, [CustomValidators.required]],
            agentId: [null],
            categoryId: [null, [CustomValidators.required]],
            priorityId: [null, [CustomValidators.required]],
            statusId: [null],
            tags: [[]]
        });
    }

    override search(restartIndex = false): void {
        if (this.v.subject) {
            this.service.addParameter('subject__icontains', this.v.subject);
        }
        if (this.customerId || this.v.customerId) {
            this.service.addParameter('customer_id', this.customerId || this.v.customerId);
        }
        if (this.v.priorityId) {
            this.service.addParameter('priority_id', this.v.priorityId);
        }
        super.search(restartIndex);
    }

    assignToMe(): void {
        const currentUser = this.main.currentUser;
        if (currentUser) {
            this.f['agentId'].setValue(currentUser.id);
            this.saveOrUpdate();
        }
    }

    closeTicket(): void {
        this.confirm('Are you sure you want to close this ticket?', 'Close Ticket Confirmation').subscribe(res => {
            if (res) {
                this.f['statusId'].setValue('closed');
                this.saveOrUpdate();
            }
        });
    }
}
