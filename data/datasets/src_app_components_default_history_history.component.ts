import {Component, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import {takeUntil} from "rxjs/operators";
import {Version} from "../../../dto/history/version";
import {BaseService} from "../../../services/base.service";
import {Subject} from "rxjs";
import {LocalDatePipe} from "../../../utilities/local-date.pipe";
import {TranslateService} from "../../../translate/translate.service";
import {Utils} from "../../../utilities/utils";

export interface HistoryData<T> {
    pk: number;
    service: BaseService<T>;
    exclude?: string[];
}

@Component({
    selector: "app-history",
    templateUrl: "./history.component.html",
    styleUrls: ["./history.component.scss"],
})
export class HistoryComponent<T> implements OnInit, OnDestroy {

    private unsubscribe = new Subject();

    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

    public displayedColumns = ["username", "name", "modified_at", "action"];
    public versions: Version<T>[] = [];
    public keys = Object.keys;

    constructor(public translate: TranslateService,
                public dialogRef: MatDialogRef<HistoryComponent<T>>,
                @Inject(MAT_DIALOG_DATA) public data: HistoryData<T>) {
    }

    public ngOnInit() {
        this.createPaginator();
        this.search();
    }

    public ngOnDestroy() {
        this.unsubscribe.next(undefined);
        this.unsubscribe.complete();
    }

    public search(): void {
        this.data.service.clearParameter();
        this.data.service.addParameter("limit", this.paginator.pageSize);
        this.data.service.addParameter("offset", (this.paginator.pageIndex * this.paginator.pageSize));
        this.data.service.getPaginatedFromDetailRoute<Version<T>>(this.data.pk, "history")
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((response) => {
                this.paginator.length = response.count;
                this.versions = response.results;
                this.excludeFields(this.versions);
            });
    }

    public cancel(): void {
        this.dialogRef.close();
    }

    public getValue(value): string {
        try {
            if (value === null || typeof value === "undefined") {
                return value;
            }
            if (typeof value === "boolean") {
                return value ? this.translate._("yes") : this.translate._("no");
            } else if (Utils.isDate(value)) {
                return new LocalDatePipe(this.translate).transform(value);
            } else {
                return value;
            }
        } catch (e) {
            return value;
        }
    }

    public normalize(key: string): string {
        return key
            .replace("is_", "")
            .replace("has_", "")
            .replace(new RegExp("_id$"), "")
            .replace(new RegExp("_", "g"), "-")
            .toLowerCase();
    }

    private excludeFields(versions: Version<T>[]): void {
        if (!versions || versions.length === 0) {
            return;
        }
        versions.forEach(t => {
            delete t.object["id"];
            delete t.object["created_at"];
            delete t.object["modified_at"];

            this.data.exclude.forEach(e => {
                delete t.object[e];
            });
        });
    }

    private createPaginator(): void {
        this.paginator.pageIndex = 0;
        this.paginator.pageSize = 10;
        this.paginator.pageSizeOptions = [5, 10, 25, 50];
    }
}
