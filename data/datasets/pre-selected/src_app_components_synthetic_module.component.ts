import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-module',
    templateUrl: './module.component.html'
})
export class ModuleComponent extends BaseComponent<any> implements OnInit {

    @Input() public platformId: string;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.MODULE,
            searchOnInit: true,
            pageSize: 20
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            title: [null, [Validators.required, CustomValidators.required]],
            order: [null, [Validators.required, Validators.min(0)]],
            description: [null, [Validators.required, Validators.maxLength(500)]],
            active: [true],
            platform_id: [this.platformId]
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.platformId) {
            this.service.addParameter('platform', this.platformId);
        }
        if (this.v.title) {
            this.service.addParameter('title__icontains', this.v.title);
        }
        super.search();
    }

    public getModuleStats(moduleId: number): void {
        this.service.getById(moduleId, 'stats').subscribe(stats => {
            this.toast.success('Stats', 'Statistics retrieved successfully');
        });
    }

    public deleteModule(moduleId: number): void {
        this.delete(moduleId, 'Are you sure?', () => this.search());
    }

    public updateOrder(moduleId: number, newOrder: number): void {
        this.service.patchFromDetailRoute(moduleId, 'order', { order: newOrder }).subscribe(() => {
            this.toast.success('Updated', 'Order updated successfully');
            this.search();
        });
    }
}
