import { Component, Injector, OnInit, Input } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-tracker",
    templateUrl: "./tracker.component.html"
})
export class TrackerComponent extends BaseComponent<any> implements OnInit {

    @Input() public vehicleId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TRACKER,
            retrieveOnInit: true,
            retrieveIdRoute: "imei",
            searchOnInit: true,
            pageSize: 10
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            if (this.vehicleId) {
                this.formGroup.patchValue({ vehicle_id: this.vehicleId });
                this.search();
            }
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            imei: [null, [CustomValidators.required, CustomValidators.nonNumber]],
            model: [null, [CustomValidators.required]],
            active: [true],
            installed_at: [null, [CustomValidators.required]],
            vehicle_id: [null],
            last_ping: [null],
            last_location: [null]
        });
    }

    public search(): void {
        const vehicleId = this.f.vehicle_id.value;
        if (vehicleId) {
            this.service.addParameter("vehicle", vehicleId);
        }
        this.service.addParameter("active", true);
        super.search(true);
    }

    public saveOrUpdate(): void {
        const imei = this.f.imei.value;
        if (imei && imei.length !== 15) {
            this.toast.error("error-title", "invalid-imei");
            return;
        }
        super.saveOrUpdate(() => {
            this.goToPage("/tracker/list");
        });
    }

    public deleteTracker(imei: string, model: string): void {
        this.delete(parseInt(imei), model, () => {
            this.search();
        });
    }
}
