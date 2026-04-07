import {Component, Inject, Injector, OnDestroy, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Subject} from "rxjs";
import {UntypedFormBuilder, UntypedFormGroup} from "@angular/forms";
import {AuthService} from "../../../services/auth.service";
import {CustomValidators} from "../../../utilities/validator/custom-validators";
import {takeUntil} from "rxjs/operators";
import {ToastService} from "../../../services/toast.service";

export interface UserDialogData {
    superUser: false;
}

@Component({
    selector: "app-user-dialog",
    templateUrl: "./user-dialog.component.html",
    styleUrls: ["./user-dialog.component.scss"]
})
export class UserDialogComponent implements OnInit, OnDestroy {

    private unsubscribe = new Subject();
    public formGroup: UntypedFormGroup;

    constructor(public toast: ToastService,
                public authService: AuthService,
                public formBuilder: UntypedFormBuilder,
                public dialogRef: MatDialogRef<UserDialogComponent>,
                public injector: Injector,
                @Inject(MAT_DIALOG_DATA) public data: UserDialogData) {
    }

    public ngOnInit() {
        this.createFormGroup();
    }

    public ngOnDestroy() {
        this.unsubscribe.next(undefined);
        this.unsubscribe.complete();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            username: [null, CustomValidators.required],
            password: [null, CustomValidators.required],
        });
    }

    public authentic(): void {
        this.authService.authentic(this.formGroup.value)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(response => this.cancel(response));
    }

    public cancel(authResponse = null): void {
        this.dialogRef.close(authResponse);
    }
}
