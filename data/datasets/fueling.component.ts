import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-fueling",
    templateUrl: "./fueling.component.html"
})
export class FuelingComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.FUELING,
            searchOnInit: true,
            pageSize: 25,
            retrieveOnInit: false
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            this.v.fuelType.valueChanges.subscribe(() => {
                this.search();
            });
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            vehicle_plate: [null, [CustomValidators.required]],
            fuel_type: [null, [CustomValidators.required]],
            liters: [null, [CustomValidators.required, CustomValidators.nonPositive, CustomValidators.nonGtZero]],
            price_per_liter: [null, [CustomValidators.required, CustomValidators.nonGtZero]],
            total_price: [null],
            station_name: [null, [CustomValidators.required]],
            created_at: [new Date().toISOString()]
        });
    }

    public calculateTotal(): void {
        const liters = this.f.liters.value;
        const price = this.f.price_per_liter.value;
        if (liters && price) {
            const total = parseFloat(liters) * parseFloat(price);
            this.formGroup.patchValue({ total_price: total.toFixed(2) });
        }
    }

    public search(): void {
        const fuelType = this.f.fuel_type.value;
        if (fuelType) {
            this.service.addParameter("type", fuelType);
        }
        super.search(true);
    }

    public saveOrUpdate(): void {
        this.calculateTotal();
        super.saveOrUpdate(() => {
            this.goToPage("/fueling/history");
        });
    }
}
