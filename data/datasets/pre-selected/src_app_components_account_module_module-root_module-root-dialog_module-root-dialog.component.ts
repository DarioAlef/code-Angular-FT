import {Component, Inject, Injector, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {take, takeUntil} from "rxjs/operators";
import {PaginatedResult} from "../../../../../dto/paginated-result";
import {URLS} from "../../../../../app/app.urls";
import {CustomValidators} from "../../../../../utilities/validator/custom-validators";
import {AutocompleteEvent} from "../../../../../shared/autocomplete/autocomplete-control.component";
import {ModuleMenu} from "../../../../../models/account/module-menu";
import {Menu} from "../../../../../models/account/menu";
import {BaseComponent} from "../../../../base.component";
import {Module} from "../../../../../models/account/module";
import {BaseService} from "../../../../../services/base.service";

export interface ModuleMenuItemData {
    module: Module;
    moduleMenu: ModuleMenu;
}

@Component({
    selector: "app-module-menu-item-dialog",
    templateUrl: "./module-root-dialog.component.html",
    styleUrls: ["./module-root-dialog.component.scss"]
})
export class ModuleRootDialogComponent extends BaseComponent<ModuleMenu> implements OnInit {

    public displayedColumns = ["description", "action"];
    public object: ModuleMenu = new ModuleMenu();

    public menuService: BaseService<Menu>;
    public rootList: PaginatedResult<Menu> = new PaginatedResult<Menu>();

    constructor(public dialogRef: MatDialogRef<ModuleRootDialogComponent>,
                public injector: Injector,
                @Inject(MAT_DIALOG_DATA) public data: ModuleMenuItemData) {
        super(injector, {endpoint: URLS.MODULE_MENU, searchOnInit: false});
        this.menuService = this.createService(Menu, URLS.MENU);
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            module: [(this.data.module as Module).url],
            menu: [null, CustomValidators.required],
        });
    }

    public getRoots(event?: AutocompleteEvent): void {

        const _search = () => {
            this.menuService.clearParameter();
            this.menuService.addParameter("limit", event?.limit ?? 10);
            this.menuService.addParameter("offset", event?.offset ?? 0);
            this.menuService.addParameter("is_root", true);
            this.menuService.addParameter("description", event?.searchText ?? "");
            this.menuService.getPaginated()
                .pipe(takeUntil(this.unsubscribe))
                .subscribe(response => this.rootList = response);
        };

        const _save = () => {
            const data = new Menu();
            data.description = event.searchText;

            this.menuService.clearParameter();
            return this.menuService.save(data).pipe(
                take(1),
            ).subscribe(() => _search());
        };

        if (event.searching) {
            _search();
        } else {
            _save();
        }

    }

    public saveOrUpdate(): void {
        super.saveOrUpdate(() => {
            this.cancel();
        });
    }

    public cancel(): void {
        this.dialogRef.close();
    }

}
