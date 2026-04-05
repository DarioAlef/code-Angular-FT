import {Component, Injector, OnInit} from "@angular/core";
import {BaseComponent} from "../../../base.component";
import {URLS} from "../../../../app/app.urls";
import {CustomValidators} from "../../../../utilities/validator/custom-validators";
import {Skill} from "../../../../models/skill";
import {PaginatedResult} from "../../../../dto/paginated-result";
import {Hero} from "../../../../models/hero";
import {BaseService} from "../../../../services/base.service";
import {AutocompleteEvent} from "../../../../shared/autocomplete/autocomplete-control.component";
import {takeUntil} from "rxjs/operators";

@Component({
    selector: "app-skill-item",
    templateUrl: "./skill-item.component.html",
    styleUrls: ["./skill-item.component.scss"]
})
export class SkillItemComponent extends BaseComponent<Skill> implements OnInit {

    public object: Skill = new Skill();

    public heroes: PaginatedResult<Hero> = new PaginatedResult<Hero>();
    public heroService: BaseService<Hero>;

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.SKILL, nextRoute: "/basic/skill", retrieveOnInit: true});
        this.main.changeTitle.next("skill");

        this.heroService = this.createService(Hero, URLS.HERO);
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            hero: [null, CustomValidators.required],
            name: [null, CustomValidators.required],
        });
    }

    public getHeroes(event: AutocompleteEvent): void {
        this.heroService.clearParameter();
        this.heroService.addParameter("limit", event.limit);
        this.heroService.addParameter("offset", event.offset);
        this.heroService.addParameter("name", event.searchText);
        this.heroService.addParameter("active", true);
        this.heroService.getPaginated()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(response => this.heroes = response);
    }
}
