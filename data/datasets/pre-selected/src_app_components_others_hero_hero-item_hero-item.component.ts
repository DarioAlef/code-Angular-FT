import {Component, Injector, OnInit} from "@angular/core";
import {BaseComponent} from "../../../base.component";
import {URLS} from "../../../../app/app.urls";
import {CustomValidators} from "../../../../utilities/validator/custom-validators";
import {Hero} from "../../../../models/hero";

@Component({
    selector: "app-hero-item",
    templateUrl: "./hero-item.component.html",
    styleUrls: ["./hero-item.component.scss"]
})
export class HeroItemComponent extends BaseComponent<Hero> implements OnInit {

    public object: Hero = new Hero();

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.HERO, nextRoute: "/basic/hero", retrieveOnInit: true});
        this.main.changeTitle.next("hero");
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, CustomValidators.required],
            age: [null, CustomValidators.nonGtZero],
        });
    }
}
