import {Component, Injector, Input, OnInit} from "@angular/core";
import {takeUntil} from "rxjs/operators";
import {CompanySettings} from "../../../../models/basic/company-settings";
import {BaseComponent} from "../../../base.component";
import {PaginatedResult} from "../../../../dto/paginated-result";
import {ContentType} from "../../../../models/account/content-type";
import {BaseService} from "../../../../services/base.service";
import {URLS} from "../../../../app/app.urls";
import {AutocompleteEvent} from "../../../../shared/autocomplete/autocomplete-control.component";
import {Permission} from "../../../../models/account/permission";

@Component({
    selector: "app-company-permission",
    templateUrl: "./company-permission.component.html",
    styleUrls: ["./company-permission.component.scss"]
})
export class CompanyPermissionComponent extends BaseComponent<Permission> implements OnInit {

    @Input()
    public companySettings: CompanySettings;

    public displayedColumns = ["code", "name", "action"];
    public object: CompanySettings = new CompanySettings();
    public contentTypes: PaginatedResult<ContentType> = new PaginatedResult<ContentType>();
    public contentTypeService: BaseService<ContentType>;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PERMISSION,
            associative: true,
            associativeRoute: "associate",
            searchOnInit: true,
            searchRoute: "find_associated",
            keepFilters: true,
        });

        this.contentTypeService = this.createService(ContentType, URLS.CONTENT_TYPE);
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            content_type: [null],
            codename_or_name: [null],
            associated: [null],
        });
    }

    public getContentTypes(event: AutocompleteEvent): void {
        this.contentTypeService.clearParameter();
        this.contentTypeService.addParameter("limit", event.limit);
        this.contentTypeService.addParameter("offset", event.offset);
        this.contentTypeService.addParameter("model", event.searchText);
        this.contentTypeService.getPaginated()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(response => this.contentTypes = response);
    }

    public search(): void {
        this.service.clearParameter();
        this.service.addParameter("target", this.companySettings.id);

        if (this.v.content_type) {
            this.service.addParameter("content_type", this.v.content_type);
        }
        if (this.v.codename_or_name) {
            this.service.addParameter("codename_or_name", this.v.codename_or_name);
        }
        if (this.v.associated != null) {
            this.service.addParameter("associated", this.v.associated);
        }

        super.search(false);
    }
}
