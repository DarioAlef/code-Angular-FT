import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/custom-validators';

@Component({
    selector: 'app-classroom',
    templateUrl: './classroom.component.html'
})
export class ClassroomComponent extends BaseComponent<any> implements OnInit {

    @Input() locationId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CLASSROOM,
            searchOnInit: true,
            retrieveIdRoute: 'id_classroom'
        });
    }

    override ngOnInit(): void {
        if (this.locationId) {
            this.service.addParameter('location', this.locationId);
        }
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            room_number: [null, [Validators.required, CustomValidators.required]],
            building: [null, [Validators.required]],
            floor: [null, [Validators.required, Validators.min(0)]],
            capacity: [30, [Validators.required, Validators.min(5)]],
            equipment: [[]],
            accessible: [true]
        });
    }

    override search(): void {
        this.service.clearParameter();
        if (this.v.room_number) {
            this.service.addParameter('room_number', this.v.room_number);
        }
        if (this.v.building) {
            this.service.addParameter('building', this.v.building);
        }
        if (this.v.floor) {
            this.service.addParameter('floor', this.v.floor);
        }
        super.search();
    }

    checkAvailability(date: string, startTime: string, endTime: string): void {
        this.service.getDetail(this.object[this.pk], 'availability', { date, startTime, endTime })
            .subscribe(res => {
                if (res.available) {
                    this.toast.success('available', 'classroom-is-available');
                } else {
                    this.toast.error('not-available', 'classroom-is-already-booked');
                }
            });
    }
}
