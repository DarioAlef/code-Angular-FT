import { Component, Injector, OnInit } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../app.urls";
import { CustomValidators } from "../../utilities/validator/custom-validators";

@Component({
    selector: "app-fine",
    templateUrl: "./fine.component.html"
})
export class FineComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.FINE,
            searchOnInit: true,
            pageSize: 50,
            searchRoute: "history"
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            this.formGroup.valueChanges.subscribe(v => {
                if (v && v.vehicle_plate && v.vehicle_plate.length === 7) {
                    this.service.addParameter("plate", v.vehicle_plate);
                    this.search();
                }
            });
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            fine_number: [null, [CustomValidators.required]],
            vehicle_plate: [null, [CustomValidators.required]],
            driver_document: [null, [CustomValidators.required]],
            amount: [null, [CustomValidators.required, CustomValidators.nonPositive, CustomValidators.nonGtZero]],
            date: [null, [CustomValidators.required]],
            location: [null, [CustomValidators.required]],
            status: ["pending"],
            description: [null]
        });
    }

    public search(): void {
        const filters = this.v;
        if (filters.status) {
            this.service.addParameter("status", filters.status);
        }
        if (filters.date) {
            this.service.addParameter("fine_date", filters.date);
        }
        super.search(true);
    }

    public payFine(): void {
        this.confirm("confirm-payment-message").subscribe(res => {
            if (res) {
                const fineId = this.object[this.pk];
                this.service.update(fineId, { status: "paid" }).subscribe(() => {
                    this.toast.success("success-title", "fine-paid");
                    this.search();
                });
            }
        });
    }
}
