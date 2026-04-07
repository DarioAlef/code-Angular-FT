import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../app/app.urls';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-product',
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss']
})
export class ProductComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PRODUCT,
            searchOnInit: true,
            keepFilters: true
        });
    }

    ngOnInit(): void {
        super.ngOnInit(() => {
            this.getBooleans();
        });
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null, [CustomValidators.required, CustomValidators.nonStartWithBlank]],
            sku: [null, [CustomValidators.required]],
            price: [0, [CustomValidators.required, CustomValidators.nonNumber]],
            stock: [0, [CustomValidators.required]],
            active: [true],
            categoryId: [null, [CustomValidators.required]]
        });
    }

    search(): void {
        if (this.v.categoryId) {
            this.service.addParameter('category', this.v.categoryId);
        }
        this.service.addParameter('ordering', 'name');
        super.search(true);
    }
}
