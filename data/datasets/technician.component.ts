import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-technician',
    templateUrl: './technician.component.html',
    styleUrls: ['./technician.component.scss']
})
export class TechnicianComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TECHNICIAN,
            searchOnInit: true,
            pageSize: 20
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required]],
            specialty: [null, [CustomValidators.required]],
            skillLevel: ['JUNIOR', [CustomValidators.required]],
            isAvailable: [true],
            hiringDate: [null]
        });
    }

    search(): void {
        const availableOnly = this.formGroup.value.isAvailable;
        if (availableOnly) {
            this.service.addParameter('status', 'AVAILABLE');
        }
        super.search(true);
    }

    reorderTechnicians(event: any): void {
        this.reorder(event, (evt) => {
            console.log('List reordered!', evt);
        });
    }

    viewHistory(technicianId: number): void {
        this.history(technicianId, 'audit_log');
    }
}
