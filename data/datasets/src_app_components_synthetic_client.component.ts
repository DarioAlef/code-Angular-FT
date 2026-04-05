import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { CustomValidators } from '../../../utilities/validator/custom-validators';

@Component({
    selector: 'app-client',
    templateUrl: './client.component.html',
    styleUrls: ['./client.component.scss']
})
export class ClientComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CLIENT,
            searchOnInit: true,
            associative: true,
            associativeRoute: 'v1/client/associate'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.getBooleans();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            fullName: [null, [CustomValidators.required]],
            email: [null, [CustomValidators.required, CustomValidators.email]],
            phone: [null, [CustomValidators.required]],
            address: [null],
            documentId: [null, [CustomValidators.required]],
            isActive: [true]
        });
    }

    toggleStatus(client: any): void {
        this.toggle(client, 'isActive', () => {
            this.search();
        });
    }

    exportClients(): void {
        this.csvExport('export-csv', 'clients_report.csv');
    }

    search(): void {
        super.search(false);
    }
}
