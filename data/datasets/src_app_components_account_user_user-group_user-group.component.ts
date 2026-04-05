import {Component, Injector, Input, OnInit} from "@angular/core";
import {URLS} from "../../../../app/app.urls";
import {User} from "../../../../models/account/user";
import {Group} from "../../../../models/account/group";
import {takeUntil} from "rxjs/operators";
import {BaseComponent} from "../../../base.component";

@Component({
    selector: "app-user-group",
    templateUrl: "./user-group.component.html",
    styleUrls: ["./user-group.component.scss"]
})
export class UserGroupComponent extends BaseComponent<Group> implements OnInit {

    @Input() user: User;

    public displayedColumns = ["name", "action"];
    public object: Group = new Group();

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.GROUP, searchOnInit: true, searchRoute: "with_granted"});
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null],
        });
    }

    public grant(id: number, granted: boolean): void {
        const data = {
            "user": this.user.id,
            "granted": granted,
        };
        this.service.clearParameter();
        this.service.postFromDetailRoute(id, "grant", data)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe();
    }

    public search(): void {
        this.service.clearParameter();
        this.service.addParameter("user", this.user.id);

        if (this.v.name) {
            this.service.addParameter("name", this.v.name);
        }
        super.search();
    }
}
