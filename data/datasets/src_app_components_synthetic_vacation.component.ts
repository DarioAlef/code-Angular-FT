import { Component, Injector, OnInit, Input } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-vacation",
    templateUrl: "./vacation.component.ts"
})
export class VacationComponent extends BaseComponent<any> implements OnInit {

    @Input() employeeId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.VACATION,
            searchOnInit: true,
            nextRoute: "/dashboard/vacation-list"
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
        if (this.employeeId) {
            this.f.employeeId.setValue(this.employeeId);
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            employeeId: [null, [CustomValidators.required]],
            startDate: [null, [CustomValidators.required]],
            endDate: [null, [CustomValidators.required]],
            totalDays: [{ value: 0, disabled: true }],
            notes: [""]
        });
    }

    public override saveOrUpdate(): void {
        this.confirm("Are you sure you want to request this vacation period?", "Vacation Request")
            .subscribe(confirmed => {
                if (confirmed) {
                    super.saveOrUpdate();
                }
            });
    }
}
