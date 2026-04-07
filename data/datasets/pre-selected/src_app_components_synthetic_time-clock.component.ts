import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-time-clock",
    templateUrl: "./time-clock.component.ts"
})
export class TimeClockComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TIME_CLOCK,
            searchOnInit: true,
            keepFilters: true,
            retrieveOnInit: false
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            employeeId: [null, [CustomValidators.required]],
            date: [new Date(), [CustomValidators.required]],
            entryTime: ["", [CustomValidators.required]],
            exitTime: [""],
            location: [""]
        });
    }

    public registerEntry(): void {
        this.service.addParameter("entry_mode", "manual");
        this.saveOrUpdateFormData();
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.v.employeeId) {
            this.service.addParameter("employee", this.v.employeeId);
        }
        if (this.v.date) {
            this.service.addParameter("date", this.v.date);
        }
        super.search();
    }
}
