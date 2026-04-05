import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-budget',
    templateUrl: './budget.component.html',
    styleUrls: ['./budget.component.scss']
})
export class BudgetComponent extends BaseComponent<any> implements OnInit {

    @Input() totalMonthlyBudget: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.BUDGET,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: 'id',
            pageSize: 12,
            keepFilters: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            campaign: [null, [CustomValidators.required]],
            allocatedAmount: [0, [CustomValidators.required, CustomValidators.min(0)]],
            spentAmount: [0, [CustomValidators.min(0)]],
            remainingAmount: [0],
            month: [new Date().getMonth() + 1, [CustomValidators.min(1), CustomValidators.max(12)]],
            year: [new Date().getFullYear(), [CustomValidators.required]],
            isOverbudget: [false],
            approvalStatus: ['PENDING']
        });
    }

    search(): void {
        const campaign = this.f.campaign.value;
        const month = this.f.month.value;
        const year = this.f.year.value;

        if (campaign) {
            this.service.addParameter('campaign', campaign);
        }

        if (month) {
            this.service.addParameter('month', month);
        }

        if (year) {
            this.service.addParameter('year', year);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        const allocated = this.f.allocatedAmount.value;
        const spent = this.f.spentAmount.value;

        this.f.remainingAmount.setValue(allocated - spent);
        this.f.isOverbudget.setValue(spent > allocated);

        if (this.f.allocatedAmount.value <= 0) {
            this.toast.error('budget-error', 'amount-greater-than-zero');
            return;
        }

        super.saveOrUpdate();
    }

    requestBudgetApproval(pk: number): void {
        this.service.postFromDetailRoute(pk, 'request-approval', {}).subscribe(() => {
            this.toast.success('approval-request-sent', 'notification-approver-delivered');
            this.search();
        });
    }

    approveBudget(pk: number): void {
        this.authentic().subscribe(user => {
            if (user && user.role === 'ADMIN') {
                this.service.patchFromDetailRoute(pk, 'approve', { approvedBy: user.id }).subscribe(() => {
                    this.toast.success('success', 'budget-approved');
                    this.search();
                });
            } else {
                this.toast.error('unauthorized', 'admin-privileges-required');
            }
        });
    }

    getBudgetPerformance(pk: number): void {
        this.service.getFromDetailRoute(pk, 'performance', {}).subscribe(response => {
            this.toast.info('budget-performance', `Current efficiency: ${response.efficiency}%`);
        });
    }
}
