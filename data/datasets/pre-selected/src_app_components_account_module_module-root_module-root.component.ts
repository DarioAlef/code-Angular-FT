import {Component, Injector, Input, OnInit} from "@angular/core";
import {URLS} from "../../../../app/app.urls";
import {takeUntil} from "rxjs/operators";
import {ModuleMenuItemDialogComponent} from "./module-menu-item-dialog/module-menu-item-dialog.component";
import {ModuleMenu} from "../../../../models/account/module-menu";
import {Module} from "../../../../models/account/module";
import {BaseComponent} from "../../../base.component";
import {ModuleRootDialogComponent} from "./module-root-dialog/module-root-dialog.component";

@Component({
    selector: "app-module-menu",
    templateUrl: "./module-root.component.html",
    styleUrls: ["./module-root.component.scss"]
})
export class ModuleRootComponent extends BaseComponent<ModuleMenu> implements OnInit {

    @Input() module: Module;

    public displayedColumns = ["description", "action"];
    public object: ModuleMenu = new ModuleMenu();

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.MODULE_MENU, searchOnInit: true});
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            description: [null],
        });
    }

    public add(module: Module): void {
        // get data
        const data = {
            width: "500px",
            data: {module: module}
        };
        // this.dialog.
        this.dialog.open(ModuleRootDialogComponent, data)
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => {
                this.search();
            });
    }

    public edit(module: Module, moduleMenu?: ModuleMenu): void {
        // get data
        const data = {
            width: "70%",
            height: "80%",
            data: {module: module, moduleMenu: moduleMenu}
        };
        // this.dialog.
        this.dialog.open(ModuleMenuItemDialogComponent, data)
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => {
                this.search();
            });
    }


    public search(): void {
        this.service.clearParameter();
        this.service.addParameter("module", this.module.id);
        this.service.addParameter("is_root", true);
        this.service.addParameter("expand", "menu");
        if (this.v.description) {
            this.service.addParameter("root_or_menu_description", this.v.description);
        }
        super.search();
    }
}
