import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent, EVENT } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-repair',
    templateUrl: './repair.component.html',
    styleUrls: ['./repair.component.scss']
})
export class RepairComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.REPAIR,
            searchOnInit: true,
            pageSize: 15
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            diagnosisId: [null, [CustomValidators.required]],
            technicianId: [null, [CustomValidators.required]],
            laborHours: [0, [CustomValidators.required]],
            totalCost: [0, [CustomValidators.required]],
            repairNotes: [null],
            isComplete: [false]
        });
    }

    deleteRepair(id: number): void {
        this.confirm('danger', 'confirm-delete-repair').subscribe(confirmed => {
            if (confirmed) {
                this.delete(id, 'Repair Request #' + id);
            }
        });
    }

    completeRepair(): void {
        this.formGroup.patchValue({ isComplete: true });
        this.saveOrUpdateFormDataPlus(() => {
            this.toast.success('success', 'repair-marked-as-complete');
            this.goToPage('inventory');
        });
    }

    search(): void {
        this.service.addParameter('complete', 'true');
        super.search(false);
    }
}
