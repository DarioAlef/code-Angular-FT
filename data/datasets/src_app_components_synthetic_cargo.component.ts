import { Component, Injector, Input, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-cargo",
    templateUrl: "./cargo.component.html"
})
export class CargoComponent extends BaseComponent<any> implements OnInit {

    @Input() public shipmentId: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CARGO,
            searchOnInit: true,
            pageSize: 15,
            retrieveOnInit: false
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            if (this.shipmentId) {
                this.formGroup.patchValue({ shipment: this.shipmentId });
                this.search();
            }
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            shipment: [null, [CustomValidators.required]],
            type: [null, [CustomValidators.required]],
            weight: [null, [CustomValidators.required, CustomValidators.nonGtZero]],
            dimensions: [null],
            fragile: [false],
            dangerous: [false]
        });
    }

    public search(): void {
        if (this.shipmentId) {
            this.service.addParameter("shipment", this.shipmentId);
        }
        const filters = this.rv;
        if (filters.fragile) {
            this.service.addParameter("fragile", true);
        }
        if (filters.dangerous) {
            this.service.addParameter("dangerous", true);
        }
        super.search(true);
    }

    public deleteCargo(cargoId: number, name: string): void {
        this.delete(cargoId, name, () => {
            this.search();
        });
    }
}
