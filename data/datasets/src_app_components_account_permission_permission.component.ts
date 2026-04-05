import {Component, Injector, Input, OnInit} from "@angular/core";
import {URLS} from "../../../app/app.urls";
import {Group} from "../../../models/account/group";
import {Permission} from "../../../models/account/permission";
import {takeUntil} from "rxjs/operators";
import {AutocompleteEvent} from "../../../shared/autocomplete/autocomplete-control.component";
import {PaginatedResult} from "../../../dto/paginated-result";
import {BaseService} from "../../../services/base.service";
import {ContentType} from "../../../models/account/content-type";
import {User} from "../../../models/account/user";
import {BaseComponent} from "../../base.component";

@Component({
    selector: "app-permission",
    templateUrl: "./permission.component.html",
    styleUrls: ["./permission.component.scss"]
})
export class PermissionComponent extends BaseComponent<Permission> implements OnInit {

    @Input() user: User;
    @Input() group: Group;

    public displayedColumns = ["code", "name", "action"];
    public object: Permission = new Permission();
    public contentTypes: PaginatedResult<ContentType> = new PaginatedResult<ContentType>();
    public contentTypeService: BaseService<ContentType>;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PERMISSION,
            searchOnInit: true,
            searchRoute: "with_granted"
        });

        this.contentTypeService = this.createService(ContentType, URLS.CONTENT_TYPE);
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            content_type: [null],
            codename_or_name: [null],
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
        if (this.v.content_type) {
            this.service.addParameter("content_type", this.v.content_type);
        }
        if (this.v.codename_or_name) {
            this.service.addParameter("codename_or_name", this.v.codename_or_name);
        }
        if (this.v.granted != null) {
            this.service.addParameter("granted", this.v.granted);
        }
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

    public grant(id: number, granted: boolean): void {
        this.service.clearParameter();

        const data = {
            "granted": granted
        };
        if (this.user) {
            data["user"] = this.user.id;
            this.service.addParameter("user", this.user.id);
        }
        if (this.group) {
            data["group"] = this.group.id;
            this.service.addParameter("group", this.group.id);
        }
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

        super.search(restartIndex);
    }
}
