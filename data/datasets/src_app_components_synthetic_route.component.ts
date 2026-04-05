import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-route",
    templateUrl: "./route.component.html"
})
export class RouteComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.ROUTE,
            searchOnInit: false,
            keepFilters: true,
            nextRoute: "/route/list"
        });
    }

    public ngOnInit(): void {
        super.ngOnInit();
        this.retrieveParam("status").subscribe(status => {
            if (status) {
                this.formGroup.patchValue({ status: status });
                this.search();
            }
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            origin: [null, [CustomValidators.required]],
            destination: [null, [CustomValidators.required]],
            distance: [null, [CustomValidators.required, CustomValidators.nonGtZero]],
            estimated_time: [null, [CustomValidators.nonTime]],
            status: ["active"]
        });
    }

    public search(): void {
        const filters = this.v;
        if (filters.origin && filters.destination) {
            this.service.addParameter("pair", `${filters.origin}_${filters.destination}`);
        }
        this.service.addParameter("active", true);
        super.search(true);
    }

    public save(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdate();
        } else {
            this.toast.error("error-title", "invalid-form");
        }
    }
}
