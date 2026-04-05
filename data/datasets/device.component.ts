import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-device',
    templateUrl: './device.component.html'
})
export class DeviceComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.DEVICE,
            searchOnInit: true,
            nextRoute: 'devices/inventory'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            macAddress: [null, [Validators.required, Validators.pattern('^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$')]],
            osName: [null, [Validators.required]],
            lastAccess: [null],
            isTrusted: [false],
            userId: [null, [Validators.required]]
        });
    }

    public search(): void {
        if (this.f.userId.value) {
            this.service.addParameter('user_id', this.f.userId.value);
        }
        if (this.f.isTrusted.value) {
            this.service.addParameter('is_trusted', this.f.isTrusted.value);
        }
        super.search();
    }

    public markAsTrusted(device: any): void {
        const patch = { isTrusted: true, trustedAt: new Date().toISOString() };
        this.service.update(device[this.pk], patch).subscribe(() => {
            this.toast.success('status-updated', 'device-is-trusted');
            this.search();
        });
    }

    public blockDevice(device: any): void {
        this.toggle(device, 'isBlocked');
    }

    public saveDevice(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdate();
        }
    }

}
