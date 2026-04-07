import {Component, Inject, Injector, OnDestroy, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {User} from "../../../../models/account/user";
import {CustomValidators} from "../../../../utilities/validator/custom-validators";
import {FormBuilder, FormGroup} from "@angular/forms";
import {AuthService} from "../../../../services/auth.service";
import {ToastService} from "../../../../services/toast.service";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

export interface ChangePasswordDialogData {
    user: User;
}

@Component({
    selector: "app-change-password-dialog",
    templateUrl: "./change-password-dialog.component.html",
    styleUrls: ["./change-password-dialog.component.scss"]
})
export class ChangePasswordDialogComponent implements OnInit, OnDestroy {

    private unsubscribe = new Subject();
    public formGroup: FormGroup;

    constructor(public toast: ToastService,
                public authService: AuthService,
                public formBuilder: FormBuilder,
                public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
                public injector: Injector,
                @Inject(MAT_DIALOG_DATA) public data: ChangePasswordDialogData) {
    }

    public ngOnInit() {
        this.createFormGroup();
    }

    public ngOnDestroy() {
        this.unsubscribe.next({});
        this.unsubscribe.complete();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            password: [null, CustomValidators.required],
            new_password: [null, CustomValidators.required],
            password_confirmation: [null, CustomValidators.required],
            reset: [false],
        });
    }

    public confirm(): void {
        if (this.v.password_confirmation !== this.v.new_password) {
            this.toast.error("user", "password-not-match");
            return;
        }
        this.authService.changePassword(this.data.user, this.v)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => {
                this.toast.success("user", "password-changed");
                this.cancel();
            });
    }

    public cancel(): void {
        this.dialogRef.close();
    }

    // convenience getter for easy access to form fields values
    get v() {
        return this.formGroup.value;
    }
}
