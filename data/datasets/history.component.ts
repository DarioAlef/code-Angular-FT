import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { History } from '../../models/history.model';

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html'
})
export class HistoryComponent extends BaseComponent<History> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.HISTORY,
            searchOnInit: true,
            pageSize: 25
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            entityName: [''],
            entityId: [null],
            action: [''],
            agentId: [null],
            dateFrom: [null],
            dateTo: [null]
        });
    }

    override search(restartIndex = false): void {
        this.service.clearParameter();
        if (this.v.entityName) this.service.addParameter('entity_name', this.v.entityName);
        if (this.v.entityId) this.service.addParameter('entity_id', this.v.entityId);
        if (this.v.agentId) this.service.addParameter('agent_id', this.v.agentId);
        if (this.v.dateFrom) this.service.addParameter('created_at__gte', this.v.dateFrom);
        if (this.v.dateTo) this.service.addParameter('created_at__lte', this.v.dateTo);

        super.search(restartIndex);
    }

    clearSearch(): void {
        this.formGroup.reset();
        this.search(true);
    }

    showDetailedLogs(item: History): void {
        this.dialog.open(DialogComponent, {
            data: {
                title: 'Detail Log',
                message: 'Action: ' + item.action,
                description: JSON.stringify(item.changes, null, 2)
            }
        });
    }
}
