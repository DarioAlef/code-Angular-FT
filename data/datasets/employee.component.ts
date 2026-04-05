import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-employee",
    templateUrl: "./employee.component.ts"
})
export class EmployeeComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.EMPLOYEE,
            searchOnInit: true,
            keepFilters: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: ["", [CustomValidators.required]],
            email: ["", [CustomValidators.required]],
            departmentId: ["", [CustomValidators.required]],
            hiringDate: [null],
            active: [true]
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.v.name) {
            this.service.addParameter("name__icontains", this.v.name);
        }
        if (this.v.departmentId) {
            this.service.addParameter("department", this.v.departmentId);
        }
        super.search(true);
    }
}
