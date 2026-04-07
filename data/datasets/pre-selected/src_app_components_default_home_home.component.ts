import {Component, Injector} from "@angular/core";
import {MainService} from "../main/main.service";

@Component({
    selector: "app-page-notfound",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"]
})
export class HomeComponent {

    constructor(public mainService: MainService,
                public injector: Injector) {

        this.mainService.changeTitle.next("welcome");
    }

}
