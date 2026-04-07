import {Directive, InjectionToken, Injector, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ToastService} from "../services/toast.service";
import {TranslateService} from "../translate/translate.service";
import {MatDialog} from "@angular/material/dialog";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {ActivatedRoute, ActivatedRouteSnapshot, NavigationExtras, Params, Router} from "@angular/router";
import {BaseService} from "../services/base.service";
import {HttpClient} from "@angular/common/http";
import {UntypedFormBuilder, UntypedFormGroup} from "@angular/forms";
import {DialogComponent} from "../shared/dialog/dialog.component";
import {interval} from "rxjs/internal/observable/interval";
import {merge, Subject} from "rxjs";
import {map, switchMap, take, takeUntil, takeWhile, tap} from "rxjs/operators";
import {AutoFocusDirective} from "../utilities/auto-focus.directive";
import {Utils} from "../utilities/utils";
import {MainService} from "./default/main/main.service";
import {HistoryComponent} from "./default/history/history.component";
import {PaginatedResult} from "../dto/paginated-result";
import {Observable} from "rxjs/internal/Observable";
import {UserDialogComponent} from "./default/user/user-dialog.component";
import {AuthUser} from "../services/auth.service";
import {Choice} from "../dto/choice";
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {MatTabGroup} from "@angular/material/tabs";
import {AESEncryptDecryptService} from "../services/crypto.service";

export interface BaseOptions {
    pk?: string;
    endpoint: string;
    paramsOnInit?: {};
    retrieveOnInit?: boolean;
    retrieveIdRoute?: string;
    retrieveRoute?: string;
    searchOnInit?: boolean;
    searchRoute?: string;
    nextRoute?: string;
    nextRouteUpdate?: string;
    keepFilters?: boolean;
    noResponse?: boolean;
    pageSize?: number;
    crossTable?: boolean;
    associative?: boolean;
    associativeRoute?: string;
}

export const EVENT = {
    RETRIEVE: 0,
    SAVE: 1,
    UPDATE: 2,
    DELETE: 3,
    SEARCH: 4,
    TOGGLE: 5,
    REORDER: 6,
};

const handler = (event: number, callback?: (event: number) => void) => {
    if (callback) {
        callback(event);
    }
};

const csvFileName = (endpoint: string) => {
    let filename = `${Utils.nowStr("DDMMYYYY_HHmmss")}.csv`;
    try {
        const split = endpoint.split("/");
        const model = split[split.length - 2];
        filename = model.concat(filename);
    } catch (e) {
    }
    return filename;
};

@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class BaseComponent<T> implements OnInit, OnDestroy {

    @ViewChild(MatTabGroup, {static: false}) tabGroup: MatTabGroup;

    @ViewChild(AutoFocusDirective, {static: false}) autoFocus: AutoFocusDirective;

    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

    @ViewChild(MatSort, {static: true}) sort: MatSort;

    public main: MainService;
    public toast: ToastService;
    public crypto: AESEncryptDecryptService;
    public translate: TranslateService;
    public dialog: MatDialog;
    public router: Router;
    public activatedRoute: ActivatedRoute;
    public http: HttpClient;
    public service: BaseService<T>;
    public dataSource: MatTableDataSource<T>;
    public formBuilder: UntypedFormBuilder;
    public formGroup: UntypedFormGroup;

    public object: T | {};
    public rawObject: T | {};
    public pk: string;

    public displayedColumns = [];
    public pageLength = 0;
    public booleans: Choice[] = [];
    public unsubscribe = new Subject();

    protected constructor(public injector: Injector,
                          public options: BaseOptions) {
        this.main = injector.get(MainService);
        this.toast = injector.get(ToastService);
        this.crypto = injector.get(AESEncryptDecryptService);
        this.translate = injector.get(TranslateService);
        this.dialog = injector.get<MatDialog>(MatDialog);
        this.router = injector.get(Router);
        this.activatedRoute = injector.get(ActivatedRoute);
        this.http = injector.get(HttpClient);
        this.formBuilder = injector.get(UntypedFormBuilder);
        this.service = injector.get(this._serviceToken());
        this.dataSource = new MatTableDataSource<T>();
        this.pk = options.pk || "id";
    }

    public ngOnInit(callback?: () => void) {
        this.createFormGroup();

        if (this.paginator) {
            this._createPaginator();
        }

        if (this.options.keepFilters && this.formGroup) {
            this._resetFormGroupWithFilters();
        }

        if (this.options.retrieveOnInit) {
            this.retrieve(callback);
        } else {
            handler(EVENT.RETRIEVE, callback);
        }

        if (this.options.searchOnInit) {
            this.search();
        }
    }

    public ngOnDestroy() {
        this.unsubscribe.next(undefined);
        this.unsubscribe.complete();
    }

    // The method will be implemented in inner class
    public abstract createFormGroup(): void;

    // Convenience getter for easy access to form fields
    get f() {
        return this.formGroup.controls;
    }

    // Convenience getter for easy access to form fields values
    get v() {
        return this.formGroup.value;
    }

    // Convenience getter for easy access to form fields raw values
    get rv() {
        return this.formGroup.getRawValue();
    }

    // Show modal dialog to confirm action
    public confirm(message?: string, subtitle?: string, wait: boolean = false): Observable<boolean> {
        const dialogRef = this.dialog.open(DialogComponent, {
            width: "350px",
            data: {
                title: this.translate._("confirm"),
                message: subtitle || this.translate._("action-confirm"),
                description: message
            }
        });

        return dialogRef.afterClosed()
            .pipe(take(1), takeWhile(value => !!value || wait));
    }

    // Show modal dialog to authenticate user
    public authentic(): Observable<AuthUser> {
        const dialogRef = this.dialog.open(UserDialogComponent, {
            width: "400px",
            data: {}
        });

        return dialogRef.afterClosed()
            .pipe(take(1), takeWhile(value => !!value));
    }

    // Create model base service
    public createService<K>(model: new () => K, path: string): BaseService<K> {
        const TOKEN = new InjectionToken<BaseService<K>>("service_" + path, {
            providedIn: "root", factory: () => new BaseService<K>(this.http, this.crypto, path),
        });
        return this.injector.get(TOKEN);
    }

    // Reload page at time interval
    public reloadPage(timeInterval: number): void {
        interval(timeInterval * 1000)
            .pipe(take(1))
            .subscribe(() => window.location.reload());
    }

    // Navigate to route
    public goToPage(route: string): void {
        const extras: NavigationExtras = {queryParamsHandling: "merge"};
        this.router.navigate([route], extras).then();
    }

    // Navigate to next tab group
    public goToTab(index: number): void {
        if (this.tabGroup) {
            this.tabGroup.selectedIndex = index;
        }
    }

    // Recover route param
    public retrieveParam(name: string): Observable<number | string> {
        return this.activatedRoute.params.pipe(
            take(1),
            map((params: Params) => {
                const value = params[name];
                return value ? value : null;
            })
        );
    }

    // Return observable with model id to retrieve
    public beforeRetrieve(): Observable<number | string> {

        // by default the id will be captured by active route parameters
        return this.activatedRoute.params.pipe(
            take(1),
            map((params: Params) => {
                const id = params[this.options.retrieveIdRoute || "action"];
                return id && id !== "create" ? id : null;
            })
        );
    }

    // Retrieve object by id
    public retrieve(callback?: () => void): void {

        // Add parameters to filter retrieve
        if (this.options.paramsOnInit) {
            const parameters = this.options.paramsOnInit;
            Object.keys(parameters).forEach(t => this.service.addParameter(t, parameters[t]));
        }
        // Retrieve object
        this.beforeRetrieve().pipe(
            take(1),
            takeWhile(id => {
                if (!!id) {
                    return true;
                }
                handler(EVENT.RETRIEVE, callback);
                return false;
            }),
            switchMap(id => {
                this.object[this.pk] = id;
                return this.service.getById(id, this.options.retrieveRoute);
            })
        ).subscribe(response => {
            this.rawObject = response;
            this._response(response, EVENT.RETRIEVE, callback);
        });
    }

    // Return observable with data to search
    public beforeSearch(): Observable<PaginatedResult<T> | T[]> {
        if (this.paginator) {
            this.service.addParameter("limit", this.paginator.pageSize);
            this.service.addParameter("offset", (this.paginator.pageIndex * this.paginator.pageSize));

            if (this.sort && this.sort.direction) {
                this.service.addParameter("ordering", this.sort.direction === "desc" ? `-${this.sort.active}` : this.sort.active);
            }

            return this.service.getPaginated(this.options.searchRoute).pipe(
                map((response: PaginatedResult<T>) => {
                    if (this.options.crossTable && response.header) {
                        this.displayedColumns = Object.keys(response.header);
                        this.dataSource["header"] = response.header;
                    }
                    this.pageLength = response.count;
                    this.dataSource.data = response.results;
                    return response;
                }),
            );
        } else {
            return this.service.getAll(this.options.searchRoute).pipe(
                map((response: T[]) => {
                    this.pageLength = response.length;
                    this.dataSource.data = response;
                    return response;
                }),
            );
        }
    }

    // Search objects
    public search(restartIndex = false, callback?: (event: number) => void): void {
        if (restartIndex && this.paginator) {
            this.paginator.pageIndex = 0;
        }

        // Store filters
        if (this.options.keepFilters) {
            this._keepActiveFilters();
        }

        this.beforeSearch()
            .subscribe(() => {
                if (this.options.associative) {
                    this._isAllAssociated();
                }

                handler(EVENT.SEARCH, callback);
            });
    }

    // Save or update object
    public saveOrUpdate(callback?: (event: number) => void): void {
        this._saveOrUpdate(false, false, callback);
    }

    // Save or update object and return to save mode
    public saveOrUpdatePlus(callback?: (event: number) => void): void {
        this._saveOrUpdate(false, true, callback);
    }

    // Save or update object as multipart/form-data
    public saveOrUpdateFormData(callback?: (event: number) => void): void {
        this._saveOrUpdate(true, false, callback);
    }

    // Save or update object as multipart/form-data and return to save mode
    public saveOrUpdateFormDataPlus(callback?: (event: number) => void): void {
        this._saveOrUpdate(true, true, callback);
    }

    // Toggle boolean fields
    public toggle(aObject: T | any, field: string, callback?: (event: number) => void): void {

        // Store field to patch
        const patch = {};
        patch[field] = aObject[field];

        // Update boolean field in object
        this.service.update(aObject[this.pk], patch)
            .pipe(take(1))
            .subscribe(() => {
                    this.toast.success("success-title", "updated-successfully");
                }, () => {
                    aObject[field] = !aObject[field];
                }, () => {
                    handler(EVENT.TOGGLE, callback);
                }
            );
    }

    // Delete object
    public delete(pk: number, description: string, callback?: (event: number) => void): void {
        // Create delete dialog reference
        const dialogRef = this.dialog.open(DialogComponent, {
            width: "350px",
            data: {
                id: pk,
                title: this.translate._("delete"),
                message: this.translate._("delete-confirm"),
                description: description
            }
        });

        dialogRef.afterClosed().pipe(
            take(1),
            takeWhile(result => result),
            switchMap(() => this.service.delete(pk))
        ).subscribe(() => {
            this.toast.success("success-title", "deleted-successfully");
            this.search();
            handler(EVENT.DELETE, callback);
        });
    }

    // Export data to csv file
    public csvExport(route?: string, fileName?: string): void {
        this.main.spinner.start();
        this.service.loadFile(route || "export", {})
            .subscribe(response => {
                Utils.downloadFileFromBlob(response, fileName || csvFileName(this.options.endpoint));
            }, () => null, () => this.main.spinner.stop());
    }

    public associate(source: number, target: number, associated: boolean): void {
        const data = {
            "source": source,
            "target": target,
            "associated": associated,
        };
        this.service.postFromListRoute(this.options.associativeRoute || "associate", data)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => {
                if (source === 0) {
                    this.search();
                } else {
                    this._isAllAssociated();
                }
            });
    }

    private _isAllAssociated(): void {
        const data = this.dataSource.data;
        const filter = data.filter(t => t["associated"]);
        this.dataSource["allAssociated"] = data.length > 0 && data.length === filter.length;
    }

    // Show model history
    public history(pk = null, ...exclude: string[]): void {
        this.dialog.open(HistoryComponent, {
            width: "60%",
            height: "80%",
            data: {
                pk: pk ? pk : this.object[this.pk],
                service: this.service,
                exclude: exclude
            }
        });
    }

    // Convenient for reorder table
    public reorder(event: CdkDragDrop<string[]>, callback?: (event: number) => void) {
        const item = this.dataSource.data[event.currentIndex];
        const itemMove = this.dataSource.data[event.previousIndex];
        this.service.clearParameter();
        this.service.patchFromDetailRoute(item[this.pk], "reorder", {"item_move": itemMove["url"]})
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => {
                this.search();
                handler(EVENT.REORDER, callback);
            });
    }

    // Convenient for boolean choices
    public getBooleans(): void {
        this.booleans = this.makeBoolChoices();
    }

    public makeBoolChoices(): Choice[] {
        const yes = new Choice("true", this.translate._("yes"));
        const no = new Choice("false", this.translate._("no"));
        return [yes, no];
    }

    // Save or update model as FormData or Object
    private _saveOrUpdate(isFormData: boolean, isPlus: boolean, callback?: (event: number) => void): void {

        // Get data to save or update
        let data;
        if (isFormData) {
            data = new FormData();
            Object.keys(this.v).forEach(key => {
                const value = this.v[key];
                data.append(key, value === null || value === undefined ? "" : value);
            });
        } else {
            Object.assign(this.object, this.rv);
            data = this.object;
        }

        // Save or update according ID
        if (this.object[this.pk]) {
            this.service.update(this.object[this.pk], data)
                .pipe(take(1))
                .subscribe(response => {
                        this.toast.success("success-title", "updated-successfully");
                        this.rawObject = response;
                        this._response(isPlus ? null : response, EVENT.UPDATE, callback);
                    }
                );
        } else {
            this.service.save(data)
                .pipe(take(1))
                .subscribe(response => {
                        this.toast.success("success-title", "saved-successfully");
                        this.rawObject = response;
                        this._response(isPlus ? null : response, EVENT.SAVE, callback);
                    }
                );
        }
    }

    private _response(response: any, event: number, callback?: (event: number) => void) {
        if (this.options.noResponse || !([EVENT.RETRIEVE, EVENT.SAVE, EVENT.UPDATE].includes(event))) {
            handler(event, callback);
            return;
        }
        if (response) {
            this.object = response;
            if (this.formGroup) {
                this.formGroup.reset(this.object);
            }

            if (this.options.nextRouteUpdate) {
                if (event === EVENT.SAVE) {
                    this._changeToUpdateMode();
                } else if (event === EVENT.UPDATE) {
                    this.goToPage(this.options.nextRouteUpdate);
                }
            } else if (this.options.nextRoute) {
                if (event === EVENT.SAVE || event === EVENT.UPDATE) {
                    this.goToPage(this.options.nextRoute);
                }
            }
        } else {
            this.object = {};
            this.createFormGroup();
            this.requestFocus();
            this._changeToCreateMode();
        }
        handler(event, callback);
    }

    // Keep filters on search
    private _keepActiveFilters(): void {
        const queryParams = {};
        Object.keys(this.v).forEach(t => queryParams[t] = this.v[t] ? this.v[t] : "");
        // queryParams["p"] = this.paginator.pageIndex;

        const extras: NavigationExtras = {relativeTo: this.activatedRoute, queryParams: queryParams};
        this.router.navigate([], extras).then();
    }

    // Get filters from active route and reset FormGroup
    private _resetFormGroupWithFilters(): void {
        if (this.options.keepFilters && this.formGroup) {
            this.activatedRoute.queryParams
                .pipe(take(1))
                .subscribe(params => {
                    Object.keys(params).forEach(t => {
                        if (t === "p") {
                            this.paginator.pageIndex = params[t];
                        } else if (this.f[t]) {
                            this.f[t].patchValue(params[t]);
                        }
                    });
                });
        }
    }

    // Make focus in auto focus field
    public requestFocus(): void {
        if (this.autoFocus) {
            setTimeout(() => {
                this.autoFocus.element.nativeElement.focus();
            }, 200);
        }
    }

    // Get own service token
    private _serviceToken(): InjectionToken<BaseService<T>> {
        return new InjectionToken<BaseService<T>>("service_" + this.options.endpoint, {
            providedIn: "root", factory: () => new BaseService<T>(this.http, this.crypto, this.options.endpoint),
        });
    }

    // Create pagination and sorting event
    private _createPaginator(): void {
        if (this.paginator) {
            this.paginator.pageIndex = 0;
            this.paginator.pageSize = this.options.pageSize || 10;
            this.paginator.pageSizeOptions = [5, 10, 25, 50];
            this.paginator.showFirstLastButtons = true;

            if (this.sort) {
                // If the user changes the sort order, reset back to the first page.
                this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

                merge(this.sort.sortChange, this.paginator.page)
                    .pipe(tap(() => this.search()))
                    .subscribe();
            } else {
                this.paginator.page
                    .pipe(tap(() => this.search()))
                    .subscribe();
            }
        }
    }

    private _changeToCreateMode() {
        const route = this._getPathRoute(this.router.routerState.snapshot.root)
            .map(path => path.replace(":action", "create"));
        this.router.navigate([route.join("/")], {queryParamsHandling: "preserve"}).then();
    }

    private _changeToUpdateMode() {
        const route = this._getPathRoute(this.router.routerState.snapshot.root)
            .map(path => path.replace(":action", this.object[this.pk]));
        this.router.navigate([route.join("/")], {queryParamsHandling: "preserve"}).then();
    }

    private _getPathRoute(route: ActivatedRouteSnapshot) {
        let array = [];
        if (route.routeConfig && route.routeConfig.path !== "") {
            array.push(route.routeConfig.path);
        }
        if (route.firstChild) {
            array = array.concat(this._getPathRoute(route.firstChild));
        }
        return array;
    }

    public enableControls(...fields: string[]): void {
        fields.forEach(key => {
            this.f[key].enable();
        });
    }

    public disableControls(...fields: string[]): void {
        fields.forEach(key => {
            this.f[key].disable();
        });
    }
}
