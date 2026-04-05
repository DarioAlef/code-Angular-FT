import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-training",
    templateUrl: "./training.component.ts"
})
export class TrainingComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TRAINING,
            searchOnInit: true,
            associative: true,
            associativeRoute: "enroll-employees"
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            title: ["", [CustomValidators.required]],
            instructor: ["", [CustomValidators.required]],
            startDate: [null, [CustomValidators.required]],
            endDate: [null, [CustomValidators.required]],
            maxParticipants: [null]
        });
    }

    public enroll(employeeId: number): void {
        this.associate(this.object[this.pk], employeeId, true);
    }

    public exportAttendance(): void {
        this.csvExport("attendance-list", `training_${this.object[this.pk]}.csv`);
    }
}
