import { Component, Injector, Input, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-vehicle",
    templateUrl: "./vehicle.component.html"
})
export class VehicleComponent extends BaseComponent<any> implements OnInit {

    @Input() public fleetId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.VEHICLE,
            searchOnInit: true,
            keepFilters: true
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            if (this.fleetId) {
                this.formGroup.patchValue({ fleet: this.fleetId });
                this.search();
            }
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            plate: [null, [CustomValidators.required]],
            model: [null, [CustomValidators.required]],
            year: [null, [CustomValidators.required, CustomValidators.nonNumber]],
            color: [null],
            fleet: [null]
        });
    }

    public search(): void {
        if (this.fleetId) {
            this.service.addParameter("fleet", this.fleetId);
        }
        super.search(true);
    }
}
