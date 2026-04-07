import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-payroll",
    templateUrl: "./payroll.component.ts"
})
export class PayrollComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PAYROLL,
            searchOnInit: false,
            associative: true,
            associativeRoute: "generate-payroll"
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            referenceMonth: ["", [CustomValidators.required]],
            referenceYear: ["", [CustomValidators.required]],
            employeeId: [null],
            status: ["PENDING"]
        });
    }

    public generatePayroll(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdate();
        } else {
            this.toast.error("error-title", "invalid-form");
        }
    }

    public exportPayrollCsv(): void {
        this.service.addParameter("month", this.v.referenceMonth);
        this.service.addParameter("year", this.v.referenceYear);
        this.csvExport("export-payroll", `payroll_${this.v.referenceMonth}_${this.v.referenceYear}.csv`);
    }
}
