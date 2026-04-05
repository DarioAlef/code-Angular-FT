import {Component, Input} from "@angular/core";

export interface MenuItem {
    icon?: string;
    label: string;
    route?: string;
    divider?: boolean;
    hidden?: boolean;
    items?: MenuItem[];
}

@Component({
    selector: "app-menu",
    templateUrl: "./menu.component.html",
})
export class MenuComponent {

    @Input() data: MenuItem[];

    @Input() showLabel = true;

    constructor() {
    }

}
