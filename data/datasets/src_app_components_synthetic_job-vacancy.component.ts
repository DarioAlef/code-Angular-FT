import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-job-vacancy",
    templateUrl: "./job-vacancy.component.ts"
})
export class JobVacancyComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.JOB_VACANCY,
            searchOnInit: true,
            keepFilters: false
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            title: ["", [CustomValidators.required]],
            description: ["", [CustomValidators.required]],
            department: ["", [CustomValidators.required]],
            salaryRange: [""],
            active: [true]
        });
    }

    public toggleVacancyStatus(vacancy: any): void {
        this.toggle(vacancy, "active", (event) => {
            this.search();
        });
    }

    public override search(): void {
        this.service.clearParameter();
        this.service.addParameter("active", this.v.active || "true");
        super.search(true);
    }
}
