import {Component, OnDestroy, OnInit} from "@angular/core";
import {AuthService} from "../../../services/auth.service";
import {TranslateService} from "../../../translate/translate.service";
import {MainService} from "./main.service";
import {SIDENAV_CONTENT_EXPANDED, SIDENAV_EXPANDED} from "./menu/menu.animation";
import {MenuItem} from "./menu/menu.component";
import {distinctUntilChanged, take, takeUntil} from "rxjs/operators";
import {MatDialog} from "@angular/material/dialog";
import {MatSidenav} from "@angular/material/sidenav";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Location} from "@angular/common";
import {User} from "../../../models/account/user";
import {AppVariables} from "../../../app/app.variables";
import {Subject} from "rxjs";
import {Utils} from "../../../utilities/utils";
import {CUSTOM_DATE_ADAPTER} from "../../../app/app.constant";
import {Module} from "../../../models/account/module";
import {Router} from "@angular/router";
import {OverlayContainer} from "@angular/cdk/overlay";
import {Title} from "@angular/platform-browser";
import {
    ChangePasswordDialogComponent
} from "../../account/user/change-password-dialog/change-password-dialog.component";
import {LoadConfigurationService} from "../../../services/load-configuration.service";
import {DomService} from "../../../services/dom.service";
import {String} from "typescript-string-operations";

@Component({
    selector: "app-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.scss"],
    animations: [SIDENAV_EXPANDED, SIDENAV_CONTENT_EXPANDED],
    providers: [CUSTOM_DATE_ADAPTER]
})
export class MainComponent implements OnInit, OnDestroy {

    private unsubscribe = new Subject();
    public module = "";
    public menu: MenuItem[] = [];
    public audio = new Audio();
    public isAlerting = false;
    public isExpanded = true;
    public title: string;
    public count: number;
    public user: User;
    public modules: Module[] = [];

    constructor(public titleService: Title,
                public variables: AppVariables,
                public authService: AuthService,
                public mainService: MainService,
                public translate: TranslateService,
                public dialog: MatDialog,
                public snackBar: MatSnackBar,
                public location: Location,
                public router: Router,
                public overlayContainer: OverlayContainer,
                public loadConfigurationService: LoadConfigurationService,
                public domService: DomService) {
        this.onChangeTitle();
        this.onChangeSnackBar();
        this.onPlaySound();
        this.onStopSound();
    }

    public ngOnInit() {
        this.loadTheme();
        if (!this.authService.isLoggedIn()) {
            this.logout();
            return;
        }
        this.user = this.authService.user;
        this.isExpanded = window.screen.width > 1024;
        this.loadModules();
        this.loadMenus();
    }

    public ngOnDestroy() {
        this.unsubscribe.next(undefined);
        this.unsubscribe.complete();
    }

    // title page
    public onChangeTitle(): void {
        const localStorageCompanyTheme = this.loadConfigurationService.getTheme();
        let company_title = "";
        if (localStorageCompanyTheme) {
            company_title = localStorageCompanyTheme.company_title;
        }
        this.mainService.changeTitle.pipe(
            takeUntil(this.unsubscribe),
            distinctUntilChanged()
        ).subscribe(nextTitle => {
            this.title = nextTitle;
            this.titleService.setTitle(company_title + " | " + this.translate._(this.title));
        });
    }

    // snack bar
    public onChangeSnackBar(): void {
        this.mainService.changeSnackBar.pipe(
            takeUntil(this.unsubscribe),
            distinctUntilChanged()
        ).subscribe(message => this.showSnackBar(message));
    }

    public showSnackBar(message: string) {
        this.snackBar.open(message, null, {
            duration: 5000,
            panelClass: "snack-bar"
        });
    }

    // resize screen
    public onResize(event): void {
        const windowWidth = event.target.innerWidth;
        this.isExpanded = windowWidth > 1024;
    }

    // sound alerts
    public onPlaySound(): void {
        this.mainService.play
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(sound => {
                this.audio.src = "assets/sounds/" + sound;
                this.audio.load();
                this.audio.play();
            });
    }

    public onStopSound(): void {
        this.mainService.stop
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => {
                this.audio.pause();
            });
    }

    // notifications
    public onLoadNotification(count: number) {
        this.count = count;
        this.isAlerting = true;
        setTimeout(() => {
            this.isAlerting = false;
        }, 200);
    }

    public updateNotifications(sidenav: MatSidenav = null): void {
        this.mainService.changeNotification.next(undefined);
        if (sidenav) {
            sidenav.toggle();
        }
    }

    // account
    public openChangePasswordDialog(): void {
        // get data
        const data = {
            width: "500px",
            data: {
                user: this.user
            }
        };
        this.dialog.open(ChangePasswordDialogComponent, data).afterClosed()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe();
    }

    public loadModules(): void {
        this.module = this.authService.module.description;

        this.authService.loadModulesAllowed(this.user)
            .pipe(take(1))
            .subscribe(response => this.modules = response);
    }

    public loadMenus(): void {
        this.menu = [];
        this.authService.loadMenus(this.module)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(response => {
                if (response.routes && response.results) {
                    Object.assign(this.menu, response["results"]);
                }
            });
    }

    public logout(): void {
        this.authService.logout(true, true);
        // localStorage.clear();
    }

    public changeModule(module: Module) {
        this.authService.module = module;
        this.router.navigate(["/"])
            .then(() => {
                location.reload();
            });
    }

    // copyright
    get copyright(): string {
        return String.format(this.translate._("all-rights-reserved"), Utils.nowStr("YYYY"));
    }

    // system version
    get version(): string {
        return String.format(this.translate._("system-version"), "1.0.0");
    }

    private loadTheme(): void {
        const localStorageCompanyTheme = this.loadConfigurationService.getTheme();
        if (localStorageCompanyTheme) {
            this.domService.document.title = localStorageCompanyTheme.company_title;
            this.domService.document.getElementById("appFavicon").setAttribute("href", localStorageCompanyTheme.company_favicon);
            this.domService.document.getElementById("appBody").setAttribute("class", localStorageCompanyTheme.default_theme + " " + localStorageCompanyTheme.company_theme);
        } else {
            this.loadConfigurationService.loadTheme();
        }
    }

}
