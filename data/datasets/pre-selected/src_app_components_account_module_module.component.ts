import {Component, Injector, OnInit} from "@angular/core";
import {URLS} from "../../../app/app.urls";
import {Module} from "../../../models/account/module";
import {BaseComponent} from "../../base.component";

@Component({
    selector: "app-module",
    templateUrl: "./module.component.html",
    styleUrls: ["./module.component.scss"]
})
export class ModuleComponent extends BaseComponent<Module> implements OnInit {

    public displayedColumns = ["id", "description", "action"];
    public object: Module = new Module();

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.MODULE, searchOnInit: true, keepFilters: true});
        this.main.changeTitle.next("module");
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            description: [null],
        });
    }

    public search(restartIndex: boolean): void {
        this.service.clearParameter();
        if (this.v.description) {
            this.service.addParameter("description", this.v.description);
        }
        super.search(restartIndex);
    }
}
