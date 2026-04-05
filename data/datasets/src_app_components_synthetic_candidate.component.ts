import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-candidate",
    templateUrl: "./candidate.component.ts"
})
export class CandidateComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CANDIDATE,
            searchOnInit: true,
            retrieveOnInit: true,
            nextRouteUpdate: "/recruitment/candidates/profile"
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            fullName: ["", [CustomValidators.required]],
            email: ["", [CustomValidators.required]],
            phoneNumber: ["", [CustomValidators.required]],
            resumeUrl: [""],
            vacancyId: [null, [CustomValidators.required]],
            status: ["APPLIED"]
        });
    }

    public uploadResume(): void {
        this.saveOrUpdateFormDataPlus();
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.v.vacancyId) {
            this.service.addParameter("vacancy", this.v.vacancyId);
        }
        if (this.v.status) {
            this.service.addParameter("status", this.v.status);
        }
        super.search();
    }
}
