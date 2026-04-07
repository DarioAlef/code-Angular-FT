import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-offboarding",
    templateUrl: "./offboarding.component.ts"
})
export class OffboardingComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.OFFBOARDING,
            searchOnInit: false,
            retrieveOnInit: true,
            nextRoute: "/hr/reports/turnover"
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            employeeId: [null, [CustomValidators.required]],
            resignationDate: [null, [CustomValidators.required]],
            reason: ["", [CustomValidators.required]],
            exitInterview: [""],
            tasksHandedOver: [false]
        });
    }

    public override saveOrUpdate(): void {
        this.confirm("Are you sure you want to finalize this offboarding process?", "Finalize Offboarding")
            .subscribe(result => {
                if (result) {
                    this.service.addParameter("status", "finalized");
                    super.saveOrUpdate();
                }
            });
    }
}
