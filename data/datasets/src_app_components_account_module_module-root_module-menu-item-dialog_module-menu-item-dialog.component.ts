import {Component, Inject, Injector, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {takeUntil} from "rxjs/operators";
import {BaseService} from "../../../../../services/base.service";
import {PaginatedResult} from "../../../../../dto/paginated-result";
import {URLS} from "../../../../../app/app.urls";
import {CustomValidators} from "../../../../../utilities/validator/custom-validators";
import {AutocompleteEvent} from "../../../../../shared/autocomplete/autocomplete-control.component";
import {ModuleMenu} from "../../../../../models/account/module-menu";
import {Menu} from "../../../../../models/account/menu";
import {BaseComponent} from "../../../../base.component";
import {Module} from "../../../../../models/account/module";

export interface ModuleMenuItemData {
    module: Module;
    moduleMenu: ModuleMenu;
}

@Component({
    selector: "app-module-menu-item-dialog",
    templateUrl: "./module-menu-item-dialog.component.html",
    styleUrls: ["./module-menu-item-dialog.component.scss"]
})
export class ModuleMenuItemDialogComponent extends BaseComponent<ModuleMenu> implements OnInit {

    public displayedColumns = ["description", "action"];
    public object: ModuleMenu = new ModuleMenu();

    public menuService: BaseService<Menu>;
    public roots: PaginatedResult<Menu> = new PaginatedResult<Menu>();
    public menus: PaginatedResult<Menu> = new PaginatedResult<Menu>();

    constructor(public dialogRef: MatDialogRef<ModuleMenuItemDialogComponent>,
                public injector: Injector,
                @Inject(MAT_DIALOG_DATA) public data: ModuleMenuItemData) {
        super(injector, {endpoint: URLS.MODULE_MENU, searchOnInit: false});
        this.menuService = this.createService(Menu, URLS.MENU);
    }

    public ngOnInit() {
        super.ngOnInit(() => {
            this.f.root.setValue((this.data.moduleMenu.menu as Menu).url);
            this.f.root.disable();
            this.search();
        });
    }

    public search() {
        this.service.clearParameter();
        this.service.addParameter("module", this.data.module.id);
        this.service.addParameter("root", (this.data.moduleMenu.menu as Menu).id);
        this.service.addParameter("expand", "menu");
        super.search();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            module: [(this.data.module as Module).url],
            root: [null, CustomValidators.required],
            menu: [null, CustomValidators.required],
        });
    }

    public getRoots(event?: AutocompleteEvent): void {
        this.menuService.clearParameter();
        this.menuService.addParameter("limit", event?.limit ?? 10);
        this.menuService.addParameter("offset", event?.offset ?? 0);
        this.menuService.addParameter("description", event?.searchText ?? "");
        this.menuService.addParameter("is_root", true);
        this.menuService.getPaginated()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((response) => this.roots = response);
    }

    public getMenus(event?: AutocompleteEvent): void {
        this.menuService.clearParameter();
        this.menuService.addParameter("limit", event?.limit ?? 10);
        this.menuService.addParameter("offset", event?.offset ?? 0);
        this.menuService.addParameter("module", this.data.module.id);
        this.menuService.addParameter("is_root", false);
        this.menuService.addParameter("description", event?.searchText ?? "");
        this.menuService.getPaginated()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(response => this.menus = response);
    }

    public saveOrUpdate(): void {
        super.saveOrUpdate(() => {
            this.object = new ModuleMenu();
            this.getMenus();
            this.search();
        });
    }

    public cancel(): void {
        this.dialogRef.close();
    }
}
