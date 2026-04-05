import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-insurance",
    templateUrl: "./insurance.component.html"
})
export class InsuranceComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.INSURANCE,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: "id"
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            this.getRequestFocus();
            this.getBooleans();
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            policy_number: [null, [CustomValidators.required]],
            vehicle_plate: [null, [CustomValidators.required]],
            company: [null, [CustomValidators.required]],
            amount: [null, [CustomValidators.required, CustomValidators.nonPositive]],
            expiration: [null, [CustomValidators.required]],
            active: [true]
        });
    }

    public search(): void {
        const filters = this.v;
        if (filters.policy_number) {
            this.service.addParameter("policy", filters.policy_number);
        }
        if (filters.vehicle_plate) {
            this.service.addParameter("plate", filters.vehicle_plate);
        }
        if (filters.company) {
            this.service.addParameter("company", filters.company);
        }
        this.service.addParameter("active", true);
        super.search(true);
    }

    public saveOrUpdate(): void {
        const policyNumber = this.f.policy_number.value;
        if (policyNumber && policyNumber.length < 5) {
            this.toast.error("error-title", "invalid-policy-number");
            return;
        }
        super.saveOrUpdate(() => {
            this.goToPage("/insurance/list");
        });
    }
}
