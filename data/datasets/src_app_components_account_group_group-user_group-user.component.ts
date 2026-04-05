import {Component, Injector, Input, OnInit} from "@angular/core";
import {Group} from "../../../../models/account/group";
import {URLS} from "../../../../app/app.urls";
import {User} from "../../../../models/account/user";
import {BaseComponent} from "../../../base.component";

@Component({
    selector: "app-group-user",
    templateUrl: "./group-user.component.html",
    styleUrls: ["./group-user.component.scss"]
})
export class GroupUserComponent extends BaseComponent<User> implements OnInit {

    @Input() group: Group;

    public displayedColumns = ["username", "name", "action"];
    public object: User = new User();

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.USER,
            associative: true,
            associativeRoute: "associate_group",
            searchOnInit: true,
            searchRoute: "find_group_associated"
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
        this.service.addParameter("is_default", false);
        this.service.addParameter("is_active", true);
        this.service.addParameter("target", this.group.id);
        this.service.addParameter("ordering", "name");

        if (this.v.description) {
            this.service.addParameter("username_or_name", this.v.description);
        }
        if (this.v.associated != null) {
            this.service.addParameter("associated", this.v.associated);
        }
        super.search();
    }
}
