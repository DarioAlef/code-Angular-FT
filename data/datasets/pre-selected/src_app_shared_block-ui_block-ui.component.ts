import {Component, Input} from "@angular/core";

@Component({
    selector: "app-block-ui",
    templateUrl: "./block-ui.component.html",
    styleUrls: ["./block-ui.component.scss"]
})
export class BlockUiComponent {

    @Input() message = "";

    constructor() {
    }
}
