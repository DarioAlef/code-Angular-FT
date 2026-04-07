import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html'
})
export class ProfileComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.PROFILE,
            searchOnInit: true,
            associative: true,
            associativeRoute: 'profiles/associate'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            name: [null],
            description: [null],
            level: [1]
        });
    }

    public toggleProfile(profile: any): void {
        this.toggle(profile, 'isActive');
    }

    public updateAssociation(profile: any, associated: boolean): void {
        this.associate(0, profile[this.pk], associated);
    }

    public viewProfileHistory(profile: any): void {
        this.history(profile[this.pk], 'lastLogin');
    }

}
