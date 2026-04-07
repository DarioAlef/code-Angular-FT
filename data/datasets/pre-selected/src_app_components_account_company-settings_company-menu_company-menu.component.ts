import {Component, Injector, Input, OnInit} from "@angular/core";
import {BaseComponent} from "../../../base.component";
import {URLS} from "../../../../app/app.urls";
import {CompanySettings} from "../../../../models/basic/company-settings";
import {Menu} from "../../../../models/account/menu";

@Component({
    selector: "app-company-menu",
    templateUrl: "./company-menu.component.html",
    styleUrls: ["./company-menu.component.scss"]
})
export class CompanyMenuComponent extends BaseComponent<Menu> implements OnInit {

    @Input()
    public companySettings: CompanySettings;

    public displayedColumns = ["description", "route", "action"];
    public object: Menu = new Menu();

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.MENU,
            associative: true,
            associativeRoute: "associate",
            searchOnInit: true,
            searchRoute: "find_associated",
            keepFilters: true,
        });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            description: [null],
            associated: [null],
        });
    }

    public search(): void {
        this.service.clearParameter();
        if (this.v.description) {
            this.service.addParameter("description", this.v.description);
        }
        if (this.v.associated != null) {
            this.service.addParameter("associated", this.v.associated);
        }
        this.service.addParameter("target", this.companySettings.id);
        super.search();
    }

}
