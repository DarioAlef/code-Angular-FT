import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/custom-validators';

@Component({
    selector: 'app-academic-record',
    templateUrl: './academic-record.component.html'
})
export class AcademicRecordComponent extends BaseComponent<any> implements OnInit {

    @Input() studentId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.ACADEMIC_RECORD,
            searchOnInit: true,
            retrieveOnInit: false,
            pageSize: 50
        });
    }

    override ngOnInit(): void {
        if (this.studentId) {
            this.service.addParameter('student', this.studentId);
        }
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            student_id: [null, [Validators.required]],
            issue_date: [new Date(), [Validators.required]],
            official: [true],
            requested_by: [null, [CustomValidators.required]],
            include_grades: [true]
        });
    }

    override search(): void {
        this.service.clearParameter();
        if (this.v.student_id) {
            this.service.addParameter('student', this.v.student_id);
        }
        if (this.v.official !== null) {
            this.service.addParameter('is_official', this.v.official);
        }
        super.search();
    }

    generateRecord(): void {
        this.service.postListRoute('generate', this.formGroup.value)
            .subscribe(res => {
                this._response(res, 1, () => {
                    this.toast.success('generated', 'academic-record-generated-successfully');
                    this.goToPage('academic-records/history');
                });
            });
    }

    downloadOfficialPDF(recordId: number): void {
        this.service.loadFile('download_pdf', { id: recordId })
            .subscribe(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `academic_record_${recordId}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
    }
}
