import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-property',
    templateUrl: './property.component.html'
})
export class PropertyComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PROPERTY,
            searchOnInit: true,
            keepFilters: true
        });
    }

    override ngOnInit() {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            address: [null, Validators.required],
            price: [null, [Validators.required, Validators.min(0)]],
            type: ['HOUSE', Validators.required],
            description: [null],
            area: [null],
            bedrooms: [0],
            bathrooms: [0],
            status: ['AVAILABLE']
        });
    }

    override search(restartIndex = false): void {
        this.service.clearParameter();
        if (this.v.type) {
            this.service.addParameter('type', this.v.type);
        }
        if (this.v.status) {
            this.service.addParameter('status', this.v.status);
        }
        super.search(restartIndex);
    }

    public updatePrice(newPrice: number): void {
        this.f.price.setValue(newPrice);
        this.saveOrUpdate();
    }
}
