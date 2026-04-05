import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-channel',
    templateUrl: './channel.component.html',
    styleUrls: ['./channel.component.scss']
})
export class ChannelComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CHANNEL,
            searchOnInit: true,
            retrieveOnInit: true,
            retrieveIdRoute: 'id',
            pageSize: 20
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required]],
            type: ['SOCIAL_MEDIA', [CustomValidators.required]],
            platform: [null, [CustomValidators.required]],
            authKey: [null],
            apiSecret: [null],
            isActive: [true, [CustomValidators.required]],
            autoSync: [false],
            syncIntervalMinutes: [15, [CustomValidators.min(5)]],
            provider: [null]
        });
    }

    search(): void {
        const type = this.f.type.value;
        const platform = this.f.platform.value;
        const isActive = this.f.isActive.value;

        if (type && type !== 'ALL') {
            this.service.addParameter('type', type);
        }

        if (platform) {
            this.service.addParameter('platform', platform);
        }

        if (isActive !== null && isActive !== undefined) {
            this.service.addParameter('is_active', isActive);
        }

        super.search(true);
    }

    saveOrUpdate(): void {
        const syncInt = this.f.syncIntervalMinutes.value || 0;
        if (syncInt < 5) {
            this.toast.error('invalid-sync-interval', 'sync-interval-min-5');
            return;
        }

        super.saveOrUpdate();
    }

    testConnection(pk: number): void {
        this.service.postFromDetailRoute(pk, 'test-connection', {}).subscribe(response => {
            if (response.success) {
                this.toast.success('connection-success', 'channel-ready-for-use');
            } else {
                this.toast.error('connection-failed', 'verify-credentials-platform-status');
            }
        });
    }

    syncChannelData(pk: number): void {
        this.service.postFromDetailRoute(pk, 'syncNow', {}).subscribe(response => {
            this.toast.info('sync-started', 'data-update-in-progress');
            this.search();
        });
    }

    deactivateChannel(pk: number, name: string): void {
        this.confirm(name, `Deactivate channel ${name}?`).subscribe(confirmed => {
            if (confirmed) {
                this.service.patchFromDetailRoute(pk, 'deactivate', { reason: 'manual' }).subscribe(() => {
                    this.toast.success('success', 'channel-deactivated');
                    this.search();
                });
            }
        });
    }
}
