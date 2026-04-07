import {Component, Injector, OnInit} from "@angular/core";
import {MainService} from "../../default/main/main.service";
import {URLS} from "../../../app/app.urls";
import {BaseComponent} from "../../base.component";
import {CustomValidators} from "../../../utilities/validator/custom-validators";
import {Company} from "../../../models/basic/company";
import {Observable} from "rxjs";
import {map, takeUntil} from "rxjs/operators";
import {BaseService} from "../../../services/base.service";
import {CompanySettings} from "../../../models/basic/company-settings";
import {Utils} from "../../../utilities/utils";

@Component({
    selector: "app-company-settings",
    templateUrl: "./company-settings.component.html",
    styleUrls: ["./company-settings.component.scss"]
})
export class CompanySettingsComponent extends BaseComponent<CompanySettings> implements OnInit {

    public object: CompanySettings = new CompanySettings();
    public company: Company;
    private companyService: BaseService<Company>;
    public themeList = [
        {value: "fpf-theme", label: "FPF"},
        {value: "gesprod-theme", label: "Gesprod"},
        {value: "ametista-theme", label: "Ametista"},
        {value: "bunker-theme", label: "Bunker"}
    ];
    public today = Utils.nowStr()

    constructor(public mainService: MainService,
                public injector: Injector) {
        super(injector, {
            pk: "id",
            endpoint: URLS.COMPANY_SETTINGS,
            nextRouteUpdate: "/account/company-settings",
            retrieveOnInit: false
        });
        this.mainService.changeTitle.next("company");
        this.companyService = this.createService(Company, URLS.COMPANY);
    }

    public ngOnInit() {
        super.ngOnInit(() => {
            this.searchCompanySettings();
        });
    }

    public searchCompanySettings() {
        this.findCompany()
            .subscribe(company => {
                this.company = company;
                if (this.company) {
                    this.findCompanySettings(company.id)
                        .subscribe(setting => {
                            if (Utils.isNull(setting)) {
                                this.object.company = company.url;
                                this.object.theme = null;
                            } else {
                                this.object = setting;
                            }
                            this.f.name.patchValue(this.company.company_name);
                            this.f.expiration_date.patchValue(this.company.license_expiration_date);
                            this.f.theme.patchValue(setting?.theme);
                            this.f.name.disable();
                        });
                } else {
                    this.router.navigate(["/basic/company"]);
                    this.toast.error("error-title", "company-notfound");
                }
            });
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, CustomValidators.required],
            theme: [null, CustomValidators.required],
            expiration_date: [null]
        });
    }

    public updateTheme(): void {
        this.object.theme = this.v.theme;
        this.company.license_expiration_date = this.v.expiration_date;

        if (Utils.isNull(this.object.id)) {
            this.service.save(this.object)
                .pipe(takeUntil(this.unsubscribe))
                .subscribe(
                    () => {
                        this.toast.success("success-title", "saved-successfully");
                        this.updateCompany();
                    }
                );
        } else {
            this.service.update(this.object.id, this.object)
                .pipe(takeUntil(this.unsubscribe))
                .subscribe(
                    () => {
                        this.toast.success("success-title", "updated-successfully");
                        this.updateCompany();
                    }
                );
        }
    }

    public updateCompany() {
        this.companyService.update(this.company.id, this.company)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => {
                this.toast.success("success-title", "updated-successfully");
                this.searchCompanySettings();
            });
    }

    // public beforeRetrieve(): Observable<number | string> {
    //     return this.service.getAll()
    //         .pipe(
    //             takeUntil(this.unsubscribe),
    //             map(response => response[0].id)
    //         );
    // }

    private findCompany(): Observable<Company> {
        return this.companyService.getAll()
            .pipe(
                takeUntil(this.unsubscribe),
                map(response => response[0])
            );
    }

    private findCompanySettings(companyId: number) {
        this.service.addParameter("company", companyId);
        return this.service.getAll()
            .pipe(
                takeUntil(this.unsubscribe),
                map(response => response[0])
            );
    }
}
