import { Component, Injector, OnInit, Input } from "@angular/core";
import { BaseComponent } from "../base.component";
import { URLS } from "../../urls";
import { CustomValidators } from "../../utilities/custom-validators";

@Component({
    selector: "app-performance-evaluation",
    templateUrl: "./performance-evaluation.component.ts"
})
export class PerformanceEvaluationComponent extends BaseComponent<any> implements OnInit {

    @Input() period: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PERFORMANCE_EVALUATION,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: "id"
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
        if (this.period) {
            this.f.period.setValue(this.period);
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            employeeId: [null, [CustomValidators.required]],
            evaluatorId: [null, [CustomValidators.required]],
            period: ["", [CustomValidators.required]],
            score: [0, [CustomValidators.required]],
            feedback: ["", [CustomValidators.required]]
        });
    }

    public override saveOrUpdate(): void {
        if (this.formGroup.valid) {
            this.service.addParameter("locked", "true");
            super.saveOrUpdatePlus(() => {
                this.goToPage("/hr/evaluations/summary");
            });
        }
    }

    public viewEvaluationHistory(employeeId: number): void {
        this.history(employeeId, "feedback");
    }
}
