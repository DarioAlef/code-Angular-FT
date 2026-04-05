import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-maintenance",
    templateUrl: "./maintenance.component.html"
})
export class MaintenanceComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.MAINTENANCE,
            retrieveOnInit: true,
            retrieveIdRoute: "id",
            nextRouteUpdate: "/maintenance/edit"
        });
    }

    public ngOnInit(): void {
        super.ngOnInit();
        this.f.vehicleId.valueChanges
            .subscribe(v => {
                if (v) {
                    this.service.addParameter("vehicle", v);
                    this.search();
                }
            });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            vehicleId: [null, [CustomValidators.required]],
            description: [null, [CustomValidators.required, CustomValidators.nonStartWithBlank]],
            cost: [null, [CustomValidators.required, CustomValidators.nonPositive]],
            scheduled_date: [null, [CustomValidators.required]],
            performed_at: [null],
            status: ["pending"]
        });
    }

    public perform(): void {
        if (this.v.status === "pending") {
            const data = this.rv;
            data.status = "completed";
            data.performed_at = new Date().toISOString();
            this.service.update(this.object[this.pk], data).subscribe(() => {
                this.toast.success("success-title", "maintenance-performed");
                this.goToPage("/maintenance/list");
            });
        }
    }

    public search(): void {
        this.service.addParameter("ordering", "-scheduled_date");
        super.search(false);
    }
}
