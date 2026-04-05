import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-driver",
    templateUrl: "./driver.component.html"
})
export class DriverComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.DRIVER,
            searchOnInit: true,
            associative: true,
            associativeRoute: "fleet_drivers"
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            this.requestFocus();
            this.getBooleans();
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required, CustomValidators.nonStartWithBlank]],
            document: [null, [CustomValidators.required, CustomValidators.nonNumber]],
            license_number: [null, [CustomValidators.required]],
            active: [true],
            hired_at: [null, [CustomValidators.required]]
        });
    }

    public toggleActive(driver: any): void {
        this.toggle(driver, "active", () => {
            this.search();
        });
    }

    public associateDriver(fleetId: number, associated: boolean): void {
        const driverId = this.object[this.pk];
        this.associate(driverId, fleetId, associated);
    }
}
