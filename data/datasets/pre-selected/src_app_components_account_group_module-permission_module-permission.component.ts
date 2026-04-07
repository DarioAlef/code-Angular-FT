import {Component, Injector, Input, OnInit} from "@angular/core";
import {URLS} from "../../../../app/app.urls";
import {BaseService} from "../../../../services/base.service";
import {takeUntil} from "rxjs/operators";
import {Module} from "../../../../models/account/module";
import {ModuleMenu} from "../../../../models/account/module-menu";
import {Group} from "../../../../models/account/group";
import {BaseComponent} from "../../../base.component";

@Component({
    selector: "app-module-permission",
    templateUrl: "./module-permission.component.html",
    styleUrls: ["./module-permission.component.scss"]
})
export class ModulePermissionComponent extends BaseComponent<Module> implements OnInit {

    @Input() group: Group;

    public object: Module = new Module();
    public moduleMenuService: BaseService<ModuleMenu>;
    public moduleMenus: ModuleMenu[] = [];

    public grantAll = false;

    constructor(public injector: Injector) {
        super(injector, {pk: "id", endpoint: URLS.MODULE, searchOnInit: true, searchRoute: "with_granted"});

        this.moduleMenuService = this.createService(ModuleMenu, URLS.MODULE_MENU);
    }

    public grantModule(id: number, granted: boolean): void {
        const data = {
            "granted": granted,
            "group": this.group.id
        };
        this.service.clearParameter();
        this.service.postFromDetailRoute(id, "grant", data)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe();
    }

    public getModuleMenus(module: Module): void {
        // store objects
        this.object = module;

        this.moduleMenuService.clearParameter();
        this.moduleMenuService.addParameter("group", this.group.id);
        this.moduleMenuService.addParameter("module", this.object.id);
        this.moduleMenuService.addParameter("is_active", true);
        this.moduleMenuService.addParameter("expand", "menu");
        this.moduleMenuService.getFromListRoute<ModuleMenu[]>("with_granted")
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(response => {
                this.moduleMenus = response;
                const granted = this.moduleMenus.filter(t => t.granted).length;
                this.grantAll = granted > 0 && granted === this.moduleMenus.length;
            });
    }

    public grantModuleMenu(id: number, granted: boolean): void {
        const data = {
            "granted": granted,
            "group": this.group.id
        };
        this.moduleMenuService.clearParameter();
        this.moduleMenuService.postFromDetailRoute(id, "grant", data)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe();
    }

    public grantAllModuleMenu(granted: boolean): void {
        if (!this.object || !this.object.url || this.moduleMenus.length === 0) {
            this.grantAll = !this.grantAll;
            return;
        }

        const data = {
            "granted": granted,
            "group": this.group.id
        };
        this.moduleMenuService.clearParameter();
        this.moduleMenuService.addParameter("group", this.group.id);
        this.moduleMenuService.addParameter("module", this.object.id);
        this.moduleMenuService.addParameter("is_active", true);
        this.moduleMenuService.postFromListRoute("grant_all", data)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => this.getModuleMenus(this.object));
    }

    public search(): void {
        this.service.clearParameter();
        this.service.addParameter("group", this.group.id);
        super.search();
    }

    public createFormGroup(): void {
    }
}
