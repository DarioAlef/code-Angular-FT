import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-session',
    templateUrl: './session.component.html'
})
export class SessionComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.SESSION,
            searchOnInit: true,
            paramsOnInit: { active_only: true },
            retrieveIdRoute: 'sessionId'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            userId: [null, [Validators.required]],
            startTime: [new Date().toISOString()],
            endTime: [null],
            ipAddress: [null, [Validators.required]],
            isSuspicious: [false],
            sessionToken: [null, [Validators.required]]
        });
    }

    public search(): void {
        this.service.clearParameter();
        if (this.f.userId.value) {
            this.service.addParameter('user_id', this.f.userId.value);
        }
        if (this.f.isSuspicious.value !== null) {
            this.service.addParameter('is_suspicious', this.f.isSuspicious.value);
        }
        if (this.f.ipAddress.value) {
            this.service.addParameter('ip_address', this.f.ipAddress.value);
        }
        super.search(true);
    }

    public markSuspicious(session: any): void {
        this.toggle(session, 'isSuspicious', (event) => {
            this.search();
        });
    }

    public terminateSession(session: any): void {
        const pk = session[this.pk];
        const user = session['userId'];
        this.delete(pk, `Session for user ${user}`, () => {
            this.search();
        });
    }

    public killAllActiveSessions(): void {
        this.confirm('kill-all-sessions', 'are-you-sure').subscribe(res => {
            if (res) {
                this.service.postFromListRoute('kill-all', {}).subscribe(() => {
                    this.toast.success('action-success', 'all-sessions-killed');
                    this.search();
                });
            }
        });
    }

}
