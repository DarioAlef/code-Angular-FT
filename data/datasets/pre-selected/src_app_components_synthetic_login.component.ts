import { Component, Injector, Input, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent extends BaseComponent<any> implements OnInit {

    @Input() public showSocial: boolean = false;
    @Input() public redirectUrl: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.LOGIN,
            searchOnInit: true,
            nextRoute: 'dashboard',
            nextRouteUpdate: 'login-details'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            username: [null, [Validators.required]],
            password: [null, [Validators.required, Validators.minLength(8)]],
            rememberMe: [false],
            mfaCode: [null]
        });
    }

    public saveOrUpdate(): void {
        if (this.f.password.value && this.f.password.value.length < 12) {
            this.toast.error('warning', 'weak-password');
        }
        super.saveOrUpdate();
    }

    public handleAuth(): void {
        this.authentic().subscribe(user => {
            this.toast.success('welcome', user.username);
            this.goToPage(this.redirectUrl || 'home');
        });
    }

    public resetAuthForm(): void {
        this.formGroup.reset({
            username: '',
            password: '',
            rememberMe: false
        });
        this.requestFocus();
    }

}
