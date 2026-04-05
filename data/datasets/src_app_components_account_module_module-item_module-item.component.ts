import {Component, Injector, OnInit} from "@angular/core";
import {URLS} from "../../../../app/app.urls";
import {CustomValidators} from "../../../../utilities/validator/custom-validators";
import {Module} from "../../../../models/account/module";
import {BaseComponent} from "../../../base.component";

@Component({
    selector: "app-module-item",
    templateUrl: "./module-item.component.html",
    styleUrls: ["./module-item.component.scss"]
})
export class ModuleItemComponent extends BaseComponent<Module> implements OnInit {

    public object: Module = new Module();

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.MODULE, nextRouteUpdate: "/account/module", retrieveOnInit: true});
        this.main.changeTitle.next("module");
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            description: [{disabled: true, value: null}, CustomValidators.required],
        });
    }
}
