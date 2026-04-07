import {Component} from "@angular/core";
import {TOAST_OPTIONS} from "./app.constant";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: []
})
export class AppComponent {

    public options = TOAST_OPTIONS;

}
