import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-delivery",
    templateUrl: "./delivery.component.html"
})
export class DeliveryComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.DELIVERY,
            searchOnInit: true,
            keepFilters: true,
            retrieveOnInit: false
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            this.activatedRoute.queryParams.subscribe(params => {
                const driverId = params.driver;
                if (driverId) {
                    this.formGroup.patchValue({ driver_id: driverId });
                    this.search();
                }
            });
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            delivery_number: [null, [CustomValidators.required]],
            recipient_name: [null, [CustomValidators.required, CustomValidators.nonStartWithBlank]],
            recipient_address: [null, [CustomValidators.required]],
            estimated_arrival: [null],
            actual_arrival: [null],
            driver_id: [null],
            delivery_status: ["pending"]
        });
    }

    public updateStatus(status: string): void {
        const deliveryId = this.object[this.pk];
        const patch = { delivery_status: status };
        this.service.update(deliveryId, patch).subscribe(() => {
            this.toast.success("success-title", "delivery-status-updated");
            this.search();
        });
    }

    public search(): void {
        const filters = this.v;
        if (filters.delivery_status) {
            this.service.addParameter("status", filters.delivery_status);
        }
        if (filters.driver_id) {
            this.service.addParameter("driver", filters.driver_id);
        }
        super.search(true);
    }
}
