import { Component, Injector, OnInit, Input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../urls';
import { Validators } from '@angular/forms';
import { CustomValidators } from '../../utilities/validator/custom-validators';

@Component({
    selector: 'app-certificate',
    templateUrl: './certificate.component.html'
})
export class CertificateComponent extends BaseComponent<any> implements OnInit {

    @Input() public studentId: number;

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.CERTIFICATE,
            searchOnInit: true,
            retrieveOnInit: false
        });
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            student_id: [this.studentId, [Validators.required, CustomValidators.required]],
            course_id: [null, [Validators.required, CustomValidators.required]],
            issue_date: [new Date(), [Validators.required]],
            expiration_date: [null],
            certificate_type: ['COMPLETION', [Validators.required]],
            validated_by_id: [null]
        });
    }

    public generateCertificate(studentId: number, courseId: number): void {
        this.service.postFromListRoute('generate', { student_id: studentId, course_id: courseId }).subscribe(() => {
            this.toast.success('Generated', 'Certificate generated and emailed');
            this.search();
        });
    }

    public downloadPdf(certificateId: number): void {
        this.service.loadFile(`${certificateId}/pdf/`, {}).subscribe(response => {
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url);
        });
    }

    public revokeCertificate(certificateId: number): void {
        this.confirm('Warning', 'Revoke this certificate?').subscribe(res => {
            if (res) {
                this.service.patchFromDetailRoute(certificateId, 'revoke', {}).subscribe(() => {
                    this.toast.success('Done', 'Certificate revoked');
                    this.search();
                });
            }
        });
    }

    public override search(): void {
        this.service.clearParameter();
        if (this.studentId) {
            this.service.addParameter('student_id', this.studentId);
        }
        if (this.v.course_id) {
            this.service.addParameter('course_id', this.v.course_id);
        }
        super.search();
    }
}
