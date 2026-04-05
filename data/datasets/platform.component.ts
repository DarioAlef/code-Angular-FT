import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-platform',
    templateUrl: './platform.component.html'
})
export class PlatformComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PLATFORM,
            searchOnInit: true,
            retrieveOnInit: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [Validators.required, CustomValidators.required]],
            domain: [null, [Validators.required, Validators.pattern('^[a-z0-9.-]+\\.[a-z]{2,}$')]],
            theme_color: ['#ffffff'],
            logo_url: [null],
            allow_self_registration: [true],
            max_users: [1000, [Validators.required, Validators.min(10)]]
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.v.name) {
            this.service.addParameter('name__icontains', this.v.name);
        }
        if (this.v.domain) {
            this.service.addParameter('domain__icontains', this.v.domain);
        }
        super.search();
    }

    public syncExternalData(): void {
        this.main.spinner.start();
        this.service.postFromListRoute('sync', {}).subscribe(() => {
            this.toast.success('Synced', 'Data synced with central server');
            this.search();
        }, () => null, () => this.main.spinner.stop());
    }

    public updateTheme(color: string): void {
        this.service.patchFromListRoute('theme', { color }).subscribe(() => {
            this.toast.success('Done', 'Theme updated across platform');
            this.search();
        });
    }

    public resetPlatformSettings(): void {
        this.confirm('Dangerous Action', 'Reset all platform settings?').subscribe(res => {
            if (res) {
                this.service.postFromListRoute('reset-settings', {}).subscribe(() => {
                    this.toast.success('Reset', 'Settings restored to defaults');
                    this.search();
                });
            }
        });
    }
}
