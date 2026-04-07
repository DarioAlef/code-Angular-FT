import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { Agent } from '../../models/agent.model';

@Component({
    selector: 'app-agent',
    templateUrl: './agent.component.html'
})
export class AgentComponent extends BaseComponent<Agent> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.AGENT,
            searchOnInit: true,
            associative: true,
            associativeRoute: 'skills'
        });
    }

    override ngOnInit(): void {
        super.ngOnInit(() => {
            this.checkAgentStatus();
        });
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            firstName: ['', [CustomValidators.required]],
            lastName: ['', [CustomValidators.required]],
            department: ['', [CustomValidators.required]],
            extension: [''],
            online: [false],
            maxActiveTickets: [5, [CustomValidators.required, CustomValidators.min(1)]],
            level: [1]
        });
    }

    checkAgentStatus(): void {
        if (this.v.online) {
            this.toast.info('Status', 'Agent is currently receiving tickets.');
        } else {
            this.toast.warning('Status', 'Agent is offline.');
        }
    }

    updateSkills(skillId: number, associated: boolean): void {
        const agentId = this.v.id;
        if (agentId) {
            this.associate(agentId, skillId, associated);
        }
    }

    viewAgentHistory(): void {
        this.history(this.v.id, 'lastLogin', 'sessionToken');
    }

    override delete(pk: number, description: string): void {
        this.confirm('This agent might have active tickets. Proceed with deletion?', 'Delete Agent').subscribe(res => {
            if (res) {
                super.delete(pk, description);
            }
        });
    }
}
