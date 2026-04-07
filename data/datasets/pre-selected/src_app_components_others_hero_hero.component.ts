import {Component, Injector, OnInit} from "@angular/core";
import {MainService} from "../../default/main/main.service";
import {URLS} from "../../../app/app.urls";
import {BaseComponent} from "../../base.component";
import {Hero} from "../../../models/hero";

@Component({
    selector: "app-hero",
    templateUrl: "./hero.component.html",
    styleUrls: ["./hero.component.scss"]
})
export class HeroComponent extends BaseComponent<Hero> implements OnInit {
    public displayedColumns = ["id", "name", "age", "active", "modified_at", "action"];

    constructor(public mainService: MainService,
                public injector: Injector) {

        super(injector, {endpoint: URLS.HERO, searchOnInit: true, keepFilters: true});
        this.mainService.changeTitle.next("hero");
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null],
            age: [null],
        });
    }

    public search(): void {
        this.service.clearParameter();

        if (this.v.name) {
            this.service.addParameter("name", this.v.name);
        }
        if (this.v.age) {
            this.service.addParameter("age", this.v.age);
        }

        super.search();
    }
}
