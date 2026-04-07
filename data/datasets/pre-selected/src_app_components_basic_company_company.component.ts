import {Component, Injector, OnInit} from "@angular/core";
import {BaseComponent} from "../../base.component";
import {Company} from "../../../models/basic/company";
import {MainService} from "../../default/main/main.service";
import {URLS} from "../../../app/app.urls";
import {CustomValidators} from "../../../utilities/validator/custom-validators";
import {debounceTime, takeUntil} from "rxjs/operators";
import {Utils} from "../../../utilities/utils";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {FileUploader} from "ng2-file-upload";
import {CompanyService} from "../../../services/company.service";

@Component({
    selector: "app-company",
    templateUrl: "./company.component.html",
    styleUrls: ["./company.component.scss"]
})
export class CompanyComponent extends BaseComponent<Company> implements OnInit {

    public object: Company = new Company();
    private maxFileSize = 2 * 1024 * 1024;
    public uploader: FileUploader;
    public filePreviewPath: SafeUrl;
    public mask_cnpj = "00.000.000/0000-99";
    private file: File;
    public mask_cep = "00000-999";
    public allowedMimeType = ["image/png", "image/jpeg"];

    constructor(public mainService: MainService,
                public injector: Injector,
                private sanitizer: DomSanitizer,
                private companyService: CompanyService) {
        super(injector, {pk: "id", endpoint: URLS.COMPANY, retrieveOnInit: true});
        this.mainService.changeTitle.next("company");
        this.uploader = new FileUploader({maxFileSize: this.maxFileSize, allowedMimeType: this.allowedMimeType});
    }

    public createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            company_name: [null, CustomValidators.required],
            fantasy_name: [null],
            cnpj: [null, CustomValidators.required],
            phone: [null],
            email: [null],
            address: [null],
            zip_code: [null],
            client_app_name: [null],
            client_app_color: [null],
            logo: [null]
        });
    }

    public ngOnInit(): void {
        super.ngOnInit(() => {
            this.initFileUploader();
            this.service.getAll()
                .pipe(
                    takeUntil(this.unsubscribe),
                    debounceTime(500)
                )
                .subscribe(companies => {
                    if (companies.length) {
                        this.object = companies[0];
                        this.formGroup.reset(this.object);
                        this.loadImage();
                    }
                });

        });
    }

    private configUploader(): void {
        this.uploader.onAfterAddingFile = (file: any) => {
            file.withCredentials = false;
            this.file = file.file;
            this.filePreviewPath = this.sanitizer.bypassSecurityTrustUrl((window.URL.createObjectURL(file._file)));
        };

        this.uploader.onWhenAddingFileFailed = (item, filter) => {
            let message = "";
            switch (filter.name) {
                case "fileSize":
                    message = "message-error-file-size-warning";
                    break;
                default:
                    message = "message-error-file-load";
                    break;
            }
            this.toast.error(this.translate._("toast-error-title"), message);
        };

    }

    private uploadLogo(): void {
        this.uploader.setOptions(this.companyService.getFullOptionsToUpload(this.object.id));
        this.uploader.uploadAll();
    }

    public saveOrUpdate(): void {
        this.f.cnpj.patchValue(Utils.onlyNumber(this.v.cnpj));
        if (this.v.postal_code) {
            this.f.postal_code.patchValue(Utils.onlyNumber(this.v.postal_code));
        }
        super.saveOrUpdate(() => {
            super.saveOrUpdateFormData((event) => {
                if (this.file) {
                    this.uploadLogo();
                } else {
                    this.router.navigate(["/basic/company"]);
                }
            });
        });
    }

    public delete(pk: number, description: string): void {
        super.delete(pk, description, () => {
            this.object = new Company();
            this.formGroup.reset(this.object);
            this.f.name.markAsPending();
            this.f.cnpj.markAsPending();
        });
    }

    public removeImage() {
        if (this.filePreviewPath) {
            this.file = null;
            this.filePreviewPath = null;
            this.f.logo.reset();
        }
    }

    public onColorChange() {
        this.f.client_app_color.setValue(this.object.client_app_color);
    }

    private initFileUploader() {
        this.uploader.onErrorItem = () => {
            this.uploader.clearQueue();
            this.toast.error(this.translate._("error-title"), this.translate._("message-error-upload"));
        };
        this.uploader.onSuccessItem = () => {
            this.uploader.clearQueue();
            this.router.navigate(["/basic/company"]);
            this.toast.success(this.translate._("success-title"), this.translate._("updated-successfully"));
        };
        this.configUploader();
    }

    private loadImage() {
        if (this.object.logo) {
            this.filePreviewPath = Utils.convertBase64ToImage(this.object.logo);
            const file = Utils.convertBase64ToBlob(this.filePreviewPath, "jpg");
            this.f.logo.patchValue(file);
        }
    }

}
