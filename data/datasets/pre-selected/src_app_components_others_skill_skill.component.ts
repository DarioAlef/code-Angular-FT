import {Component, Injector, OnInit} from "@angular/core";
import {URLS} from "../../../app/app.urls";
import {BaseComponent} from "../../base.component";
import {Skill} from "../../../models/skill";

@Component({
    selector: "app-skill",
    templateUrl: "./skill.component.html",
    styleUrls: ["./skill.component.scss"]
})
export class SkillComponent extends BaseComponent<Skill> implements OnInit {
    public displayedColumns = ["id", "hero", "name", "active", "modified_at", "action"];

    constructor(public injector: Injector) {
        super(injector, {endpoint: URLS.SKILL, searchOnInit: true, keepFilters: true});
        this.main.changeTitle.next("skill");
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null],
        });
    }

    public search(): void {
        this.service.clearParameter();
        this.service.addParameter("expand", "hero");

        if (this.v.name) {
            this.service.addParameter("name", this.v.name);
        }

        super.search();
    }
}
