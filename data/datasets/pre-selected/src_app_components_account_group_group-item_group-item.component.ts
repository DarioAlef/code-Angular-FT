import {Component, Injector, OnInit} from "@angular/core";
import {URLS} from "../../../../app/app.urls";
import {CustomValidators} from "../../../../utilities/validator/custom-validators";
import {Group} from "../../../../models/account/group";
import {BaseComponent} from "../../../base.component";

@Component({
    selector: "app-group-item",
    templateUrl: "./group-item.component.html",
    styleUrls: ["./group-item.component.scss"]
})
export class GroupItemComponent extends BaseComponent<Group> implements OnInit {

    public object: Group = new Group();

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.GROUP, nextRouteUpdate: "/account/group", retrieveOnInit: true});
        this.main.changeTitle.next("group");
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, CustomValidators.required],
        });
    }
}
