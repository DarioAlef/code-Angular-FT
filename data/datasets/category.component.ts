import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { Category } from '../../models/category.model';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html'
})
export class CategoryComponent extends BaseComponent<Category> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CATEGORY,
            searchOnInit: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            name: ['', [CustomValidators.required]],
            description: [''],
            parentId: [null],
            colorCode: ['#ffffff'],
            active: [true]
        });
    }

    toggleActiveState(category: Category): void {
        this.toggle(category, 'active');
    }

    fetchSubcategories(parentId: number): void {
        this.service.clearParameter();
        this.service.addParameter('parent_id', parentId);
        this.search();
    }

    reorderCategories(event: any): void {
        this.reorder(event, () => {
            this.toast.success('Success', 'Category order updated.');
        });
    }
}
