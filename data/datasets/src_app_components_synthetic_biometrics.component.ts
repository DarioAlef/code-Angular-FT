import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-biometrics',
    templateUrl: './biometrics.component.html'
})
export class BiometricsComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.BIOMETRICS,
            retrieveOnInit: true,
            searchOnInit: false
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            biometricType: ['FINGERPRINT', [Validators.required]],
            userId: [null, [Validators.required]],
            rawHash: [null, [Validators.required, Validators.minLength(64)]],
            isConfirmed: [false],
            lastUpdate: [new Date().toISOString()]
        });
    }

    public registerBiometric(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdateFormData();
        } else {
            this.toast.error('invalid-data', 'invalid-biometric-hash');
        }
    }

    public verifyBiometricHash(id: string, hash: string): void {
        this.service.postFromDetailRoute(id, 'verify', { hash: hash }).subscribe(response => {
            if (response && response.valid) {
                this.toast.success('biometric-success', 'biometric-verified');
            } else {
                this.toast.error('biometric-error', 'biometric-not-verified');
            }
        });
    }

    public revokeBiometric(): void {
        this.confirm('revoke-confirm', 'biometric-revoke').subscribe(res => {
            if (res) {
                this.service.delete(this.object[this.pk]).subscribe(() => {
                    this.toast.success('revoked', 'biometric-revoked');
                    this.goToPage('users');
                });
            }
        });
    }

}
