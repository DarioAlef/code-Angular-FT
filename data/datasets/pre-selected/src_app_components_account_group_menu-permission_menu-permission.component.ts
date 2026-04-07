import {Component, Injector, Input, OnInit} from "@angular/core";
import {URLS} from "../../../../app/app.urls";
import {Group} from "../../../../models/account/group";
import {takeUntil} from "rxjs/operators";
import {User} from "../../../../models/account/user";
import {ModuleMenu} from "../../../../models/account/module-menu";
import {BaseComponent} from "../../../base.component";


@Component({
    selector: "app-menu-permission",
    templateUrl: "./menu-permission.component.html",
    styleUrls: ["./menu-permission.component.scss"]
})
export class MenuPermissionComponent extends BaseComponent<ModuleMenu> implements OnInit {

    @Input() user: User;
    @Input() group: Group;

    public displayedColumns = ["root", "description", "action"];
    public object: ModuleMenu = new ModuleMenu();

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.MODULE_MENU, searchOnInit: true, searchRoute: "with_granted"});

    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            root_or_description: [null],
            granted: [null],

        });
    }

    public loadParameters(): void {
        this.service.clearParameter();

        if (this.user) {
            this.service.addParameter("user", this.user.id);
        }
        if (this.group) {
            this.service.addParameter("group", this.group.id);
        }
        if (this.v.root_or_description) {
            this.service.addParameter("root_or_menu_description", this.v.root_or_description);
        }

        if (this.v.granted != null) {
            this.service.addParameter("granted", this.v.granted);
        }
    }


    public grant(id: number, granted: boolean): void {
        const data = {
            "granted": granted
        };
        if (this.user) {
            data["user"] = this.user.id;
        }
        if (this.group) {
            data["group"] = this.group.id;
        }
        this.service.clearParameter();
        this.service.postFromDetailRoute(id, "grant", data)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe();
    }


    public grantAll(granted: boolean): void {
        const data = {
            "granted": granted
        };
        if (this.user) {
            data["user"] = this.user.id;
        }
        if (this.group) {
            data["group"] = this.group.id;
        }
        this.loadParameters();
        this.service.postFromListRoute("grant_all", data)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => this.search(false));
    }


    public search(restartIndex: boolean): void {
        this.loadParameters();
        this.service.addParameter("expand", "menu,root");
        super.search(true);
    }
}
