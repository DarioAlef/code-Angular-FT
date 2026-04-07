import {Component, Injector, OnInit} from "@angular/core";
import {URLS} from "../../../app/app.urls";
import {User} from "../../../models/account/user";
import {AuthService} from "../../../services/auth.service";
import {BaseComponent} from "../../base.component";

@Component({
    selector: "app-user",
    templateUrl: "./user.component.html",
    styleUrls: ["./user.component.scss"]
})
export class UserComponent extends BaseComponent<User> implements OnInit {

    public displayedColumns = ["id", "username", "name", "email", "superuser", "active", "action"];
    public object: User = new User();

    constructor(public injector: Injector,
                public authService: AuthService) {

        super(injector, {endpoint: URLS.USER, searchOnInit: true, keepFilters: true});
        this.main.changeTitle.next("user");

        if (!this.authService.user.is_superuser) {
            this.displayedColumns = ["id", "username", "name", "email", "active", "action"];
        }
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            username_or_name: [null],
        });
    }

    public search(restartIndex: boolean): void {
        this.service.clearParameter();
        this.service.addParameter("is_default", false);

        if (this.v.username_or_name) {
            this.service.addParameter("username_or_name", this.v.username_or_name);
        }
        super.search(restartIndex);
    }
}
