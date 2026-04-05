import {Component, Input, OnChanges, Output, SimpleChanges, ViewChild} from "@angular/core";
import {PaginatedResult} from "../../dto/paginated-result";
import {Subject} from "rxjs";
import {MatAutocomplete} from "@angular/material/autocomplete";
import {AutocompleteEvent} from "./autocomplete-control.component";

export const emptyFn = () => {
};

// Function to convert value to array value
export function valueToArray(value: any) {
    if (!value) {
        return;
    }
    return value instanceof Array ? value : [value];
}

@Component({
    selector: "app-autocomplete",
    exportAs: "appAutoComplete",
    templateUrl: "autocomplete.component.html"
})
export class AutocompleteComponent implements OnChanges {

    @ViewChild(MatAutocomplete, {static: true}) matAutocomplete: MatAutocomplete;

    @Input() id: string;

    @Input() display: any;

    @Input() expands: string[] = [];

    @Input() paginatedResult = new PaginatedResult();

    @Input() filteredBy: AutocompleteComponent;

    @Input() filteredFields: any;

    @Input() filteredFieldsAs: any;

    @Input() createMode = false;

    @Output() changeEvent = new Subject<AutocompleteEvent>();

    public item: any = {};

    public selectedItemEvent = new Subject();

    public _displayFn: (value: any) => string;

    public _resultChanges = new Subject<PaginatedResult<any>>();

    public _paginationEvent = new Subject<boolean>();

    public _searchEvent = new Subject<string>();

    public _reset: (all: boolean) => void = emptyFn;

    public _searching = false;

    public _disabled = false;

    constructor() {
        this._displayFn = this.displayFn.bind(this);
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes["paginatedResult"]) {
            this._resultChanges.next(changes["paginatedResult"].currentValue);
        }
    }

    // Function bind auto complete displayWith
    public displayFn(value: any): string {
        return value ? this.displayValue(value) : value;
    }

    // Show value from object [array or string]
    public displayValue(value: any): string {
        const values = valueToArray(this.display).map(t => {
            return this.children(value, t);
        });
        return values ? values.join(" - ") : value;
    }

    // Get keys from item recursive
    private children(item: any, key: string): string {
        try {
            let _item = item;
            const split = key.split(".");
            split.forEach(t => _item = _item[t]);
            return _item;
        } catch (e) {
            return "";
        }
    }
}
