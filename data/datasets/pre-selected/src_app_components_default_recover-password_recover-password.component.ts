import {Component, OnInit} from "@angular/core";
import {CustomValidators} from "../../../utilities/validator/custom-validators";
import {ActivatedRoute, Router} from "@angular/router";
import {UntypedFormBuilder, UntypedFormGroup} from "@angular/forms";
import {RecoverService} from "../../../services/recover.service";
import {ToastService} from "../../../services/toast.service";
import {MainService} from "../main/main.service";


@Component({
    selector: "app-recover-password",
    templateUrl: "./recover-password.component.html",
    styleUrls: ["./recover-password.component.scss"]
})
export class RecoverPasswordComponent implements OnInit {

    public formGroup: UntypedFormGroup;
    public url: string;
    public message: string;

    constructor(public mainService: MainService,
                public recoverService: RecoverService,
                public formBuilder: UntypedFormBuilder,
                public route: ActivatedRoute,
                public toast: ToastService,
                public router: Router) {
    }

    public ngOnInit() {
        this.createFormGroup();
        // get return url from route parameters or default to '/'
        this.url = this.route.snapshot.queryParams["u"] || "/";
        this.message = "send-email";
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            username: [null, CustomValidators.required],
        });
    }

    public sendEmail(): void {
        this.message = "sending";
        this.recoverService.recoverPassword(this.formGroup.value)
            .subscribe(
                (response) => {
                    this.message = "send-email";
                    this.router.navigate([this.url]);
                    this.toast.success("success-title", response["detail"]);
                }
            );
    }
}
