import {Component, Injector, OnInit} from "@angular/core";
import {BaseComponent} from "../../../base.component";
import {URLS} from "../../../../app/app.urls";
import {Module} from "../../../../models/account/module";

@Component({
    selector: "app-company-module",
    templateUrl: "./company-module.component.html",
    styleUrls: ["./company-module.component.scss"]
})
export class CompanyModuleComponent extends BaseComponent<Module> implements OnInit {

    public displayedColumns = ["description", "active"];
    public object: Module = new Module();

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.MODULE,
            searchOnInit: true,
            keepFilters: true,
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            description: [null],
        });
    }

    public search(): void {
        this.service.clearParameter();
        if (this.v.description) {
            this.service.addParameter("description", this.v.description);
        }
        super.search();
    }

}
