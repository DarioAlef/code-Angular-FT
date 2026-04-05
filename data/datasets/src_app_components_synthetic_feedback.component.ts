import { Component, Injector, Input, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../utilities/urls';
import { CustomValidators } from '../../utilities/custom-validators';
import { Feedback } from '../../models/feedback.model';

@Component({
    selector: 'app-feedback',
    templateUrl: './feedback.component.html'
})
export class FeedbackComponent extends BaseComponent<Feedback> implements OnInit {

    @Input() ticketId: number;
    @Input() customerId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.FEEDBACK,
            searchOnInit: false,
            noResponse: true
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
        if (this.ticketId) {
            this.f['ticketId'].setValue(this.ticketId);
        }
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            id: [null],
            ticketId: [null, [CustomValidators.required]],
            rating: [5, [CustomValidators.required, CustomValidators.min(1), CustomValidators.max(5)]],
            comment: ['', [CustomValidators.maxLength(500)]],
            anonymous: [false],
            attachment: [null]
        });
    }

    submitSurvey(): void {
        if (this.formGroup.invalid) return;

        this.confirm('Submit your feedback?', 'Confirmation').subscribe(res => {
            if (res) {
                if (this.f['attachment'].value) {
                    this.saveOrUpdateFormData(() => this.onSuccess());
                } else {
                    this.saveOrUpdate(() => this.onSuccess());
                }
            }
        });
    }

    private onSuccess(): void {
        this.toast.success('Thank you!', 'Your feedback was submitted.');
        this.goToPage('/thanks');
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.f['attachment'].setValue(file);
        }
    }

    override search(restartIndex = false): void {
        this.service.addParameter('rating__gte', 4);
        super.search(restartIndex);
    }
}
