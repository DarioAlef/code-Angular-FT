import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../app/app.urls';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-review',
    templateUrl: './review.component.html'
})
export class ReviewComponent extends BaseComponent<any> implements OnInit {

    @Input() productId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.REVIEW,
            searchOnInit: true,
            pageSize: 5
        });
    }

    ngOnInit(): void {
        super.ngOnInit(() => {
            if (this.productId) {
                this.service.addParameter('product', this.productId);
            }
        });
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            productId: [this.productId, [CustomValidators.required]],
            userId: [null, [CustomValidators.required]],
            rating: [5, [CustomValidators.required]],
            comment: [null, [CustomValidators.required]],
            recommended: [true]
        });
    }

    public submitReview(): void {
        if (this.formGroup.valid) {
            this.saveOrUpdate(event => {
                this.toast.success('review-submitted', 'thanks-for-feedback');
                this.search();
            });
        }
    }
}
