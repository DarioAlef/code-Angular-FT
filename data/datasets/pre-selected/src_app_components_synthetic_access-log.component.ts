import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';

@Component({
    selector: 'app-access-log',
    templateUrl: './access-log.component.html'
})
export class AccessLogComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.ACCESS_LOG,
            searchOnInit: true,
            keepFilters: true,
            pageSize: 25
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            user: [null],
            ipAddress: [null],
            startDate: [null],
            endDate: [null],
            status: [null]
        });
    }

    public search(): void {
        this.service.clearParameter();
        if (this.f.user.value) {
            this.service.addParameter('user', this.f.user.value);
        }
        if (this.f.ipAddress.value) {
            this.service.addParameter('ip_address', this.f.ipAddress.value);
        }
        if (this.f.status.value) {
            this.service.addParameter('status', this.f.status.value);
        }
        if (this.f.startDate.value) {
            this.service.addParameter('date__gte', this.f.startDate.value);
        }
        if (this.f.endDate.value) {
            this.service.addParameter('date__lte', this.f.endDate.value);
        }
        super.search(true);
    }

    public exportLogs(): void {
        const fileName = `access-logs-export-${Date.now()}.csv`;
        this.csvExport('access-logs/export-csv/', fileName);
    }

    public clearFilters(): void {
        this.formGroup.reset();
        this.search(true);
    }

    public viewDetailedHistory(): void {
        this.history(null, 'internalSessionId');
    }

}
