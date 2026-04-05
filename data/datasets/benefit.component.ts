import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-benefit",
    templateUrl: "./benefit.component.ts"
})
export class BenefitComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.BENEFIT,
            searchOnInit: true,
            pageSize: 25
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            description: ["", [CustomValidators.required]],
            type: ["", [CustomValidators.required]],
            value: [0, [CustomValidators.required]],
            mandatory: [false]
        });
    }

    public toggleMandatory(benefit: any): void {
        this.toggle(benefit, "mandatory");
    }

    public override delete(pk: number, description: string): void {
        super.delete(pk, description, () => {
            this.search(true);
        });
    }
}
