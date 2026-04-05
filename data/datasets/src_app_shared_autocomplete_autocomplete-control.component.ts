import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {AutocompleteComponent, valueToArray} from "./autocomplete.component";
import {debounceTime, distinctUntilChanged, map, takeUntil, tap} from "rxjs/operators";
import {Subject} from "rxjs";

export interface AutocompleteEvent {
    limit: any;
    offset: any;
    searchText: string;
    searching: boolean;
    filteredBy?: any;
}

function stopPropagation(event: MouseEvent, stop: boolean = true) {
    event.preventDefault();
    if (stop) {
        event.stopPropagation();
    }
}

@Component({
    selector: "app-autocomplete-control",
    templateUrl: "./autocomplete-control.component.html",
    styleUrls: ["autocomplete-control.component.scss"]
})
export class AutocompleteControlComponent implements OnInit, OnDestroy {

    private unsubscribe = new Subject();

    @Input() for: AutocompleteComponent;

    @Input() limit = 10;

    // Current offset of pagination
    private _offset = 0;

    // Current page of pagination
    private _page = 0;

    // Current search text
    private _searchText = "";

    private _noResultsFound = true;

    public ngOnInit() {
        this.waitForPagination();
        this.waitForSearch();
        this.loadPagination();
    }

    public ngOnDestroy() {
        this.unsubscribe.next(undefined);
        this.unsubscribe.complete();
    }

    // Load pagination event
    private loadPagination(): void {
        if (this.for.filteredBy) {
            this.for.filteredBy.selectedItemEvent.pipe(
                takeUntil(this.unsubscribe),
                tap(() => this.for._reset(false))
            ).subscribe(() => {
                this.paginationEvent(true);
            });
        } else {
            this.paginationEvent();
        }
    }

    // Function to wait the pagination
    private waitForPagination(): void {
        this.for._paginationEvent.pipe(
            takeUntil(this.unsubscribe)
        ).subscribe(nextPage => {
            this.pagination(nextPage);
        });

        this.for._resultChanges.pipe(
            takeUntil(this.unsubscribe),
            map(result => result.count === 0 && this._searchText.length > 0)
        ).subscribe(noResults => this._noResultsFound = noResults);
    }

    // Function to wait filter entered by user
    private waitForSearch(): void {
        this.for._searchEvent.pipe(
            takeUntil(this.unsubscribe),
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(value => {
            if (this.for._searching === false && !value) {
                return;
            }
            this.for._searching = !!value;
            this._searchText = value.toString().trim();
            this.paginationEvent(true, value.toString());
        });
    }

    // Function to emit when change form formControl
    private paginationEvent(firstPage: boolean = false, searchText: string = "", searching: boolean = true): void {
        if (firstPage) {
            this._page = 0;
            this._offset = 0;
        }
        const emit: AutocompleteEvent = {
            limit: this.limit,
            offset: this._offset,
            searching: searching,
            searchText: this.for._searching ? this._searchText : searchText,
        };
        if (searching) {
            this.filteredValues(emit);
        }
        this.for.changeEvent.next(emit);
    }

    // Function to load pagination
    private pagination(nextPage: boolean): void {
        let worked = false;
        if (nextPage && this.for.paginatedResult.next) {
            this._page++;
            worked = true;
        }
        if (!nextPage && this.for.paginatedResult.previous) {
            this._page--;
            worked = true;
        }
        if (worked) {
            this._offset = this._page * this.limit;
            this.paginationEvent();
        }
    }

    // Function to get data de filtered values
    private filteredValues(emit: AutocompleteEvent): void {
        const source = this.for.filteredBy;
        if (source && source.item) {
            const filteredBy = {};
            const filters = valueToArray(this.for.filteredFields);
            const filtersAs = valueToArray(this.for.filteredFieldsAs);
            filters.forEach((t, index) => {
                const value = source.item[t];
                const key = filtersAs && index < filtersAs.length ? filtersAs[index] : t;
                if (key && value) {
                    filteredBy[key] = value;
                }
            });
            emit.filteredBy = filteredBy;
        }
    }

    // Function to go previous page
    public previousPage(event: MouseEvent): void {
        stopPropagation(event);
        this.pagination(false);
    }

    // Function to go next page
    public nextPage(event: MouseEvent): void {
        stopPropagation(event);
        this.pagination(true);
    }

    // Function to clear input
    public clear(event: MouseEvent): void {
        stopPropagation(event);
        this.for._reset(true);
    }

    // Create event
    public create(event: MouseEvent): void {
        stopPropagation(event, false);
        this.paginationEvent(true, this._searchText, false);
    }

    // Open popup
    public openPopup(event: MouseEvent): void {
        stopPropagation(event, false);
    }

    // Can show clear button?
    get canShowClearButton(): boolean {
        return ((this.for.item && this.for.item[this.for.id]) || this.for._searching) && !this.for._disabled;
    }

    // Can show create button?
    get canShowCreateButton(): boolean {
        return this._noResultsFound && this.for.createMode && !this.for._disabled;
    }
}
