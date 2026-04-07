import {Component, OnInit} from "@angular/core";
import {MainService} from "../main/main.service";
import {CustomValidators} from "../../../utilities/validator/custom-validators";
import {AuthService} from "../../../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {FormBuilder, FormGroup} from "@angular/forms";
import {TranslateService} from "../../../translate/translate.service";
import {DateAdapter} from "@angular/material/core";
import {LANG_PT_NAME} from "../../../translate/lang-pt";
import {LANG_EN_NAME} from "../../../translate/lang-en";
import {Module} from "../../../models/account/module";
import {take} from "rxjs/operators";
import {ToastService} from "../../../services/toast.service";
import {User} from "../../../models/account/user";
import {MatButtonToggleChange} from "@angular/material/button-toggle";
import {LoadConfigurationService} from "../../../services/load-configuration.service";
import {DomService} from "../../../services/dom.service";

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit {

    public formGroup: FormGroup;
    public url: string;
    public message: string;
    public en = LANG_EN_NAME;
    public pt = LANG_PT_NAME;
    public modules: Module[] = [];

    constructor(public mainService: MainService,
                public authService: AuthService,
                public domService: DomService,
                public loadConfigurationService: LoadConfigurationService,
                public formBuilder: FormBuilder,
                public translate: TranslateService,
                public dateAdapter: DateAdapter<Date>,
                public route: ActivatedRoute,
                public router: Router,
                public toast: ToastService) {

    }

    public ngOnInit() {
        this.loadTheme();
        this.createFormGroup();
        this.loadModules();
        this.message = "sign-in";
        this.url = this.route.snapshot.queryParams["u"] || "/";
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            username: [null, CustomValidators.required],
            password: [null, CustomValidators.required],
            module: [null, CustomValidators.required],
        });
    }

    public login(): void {
        if (this.translate.currentLang == null) {
            this.translate.use(LANG_PT_NAME);
        }
        const user = new User();
        user.username = this.v.username;
        user.password = this.v.password;
        this.message = "processing";
        this.authService.login(user)
            .pipe(take(1))
            .subscribe({
                next: response => {
                    this.checkModulePermission();
                },
                error: () => {
                    this.message = "sign-in";
                    this.f.password.reset();
                }
            });
    }

    public checkModulePermission(): void {
        this.authService.canUseModule(this.v.module)
            .subscribe(response => {
                if (response.detail) {
                    this.authService.module = this.v.module;
                    this.router.navigate(["/"])
                        .then(() => location.reload());
                } else {
                    this.message = "sign-in";
                    this.toast.error("login", "you-are-not-allowed-to-use-module");
                }
            });
    }

    public loadModules(): void {
        this.authService.loadModules()
            .pipe(take(1))
            .subscribe(response => {
                this.modules = response;
                this.f.module.setValue(this.modules[0]);
            });
    }

    private get f() {
        return this.formGroup.controls;
    }

    private get v() {
        return this.formGroup.value;
    }

    public changeLanguage(event: MatButtonToggleChange): void {
        let language = event.source.value;

        if (language === "en") {
            this.translate.use(language);
            this.dateAdapter.setLocale(this.translate.currentLang);
        } else {
            this.translate.use("pt");
            this.dateAdapter.setLocale(this.translate.currentLang);
        }
    }

    private loadTheme(): void {
        this.loadConfigurationService.loadTheme();
    }

}
