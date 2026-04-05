import {Component, EventEmitter, Output, ViewEncapsulation} from "@angular/core";

@Component({
    selector: "app-progress",
    templateUrl: "./progress.component.html",
    styleUrls: ["./progress.component.scss"],
    encapsulation: ViewEncapsulation.None,
})
export class ProgressComponent {
    public percentage: number;
    public labelProgress: string;
    public show = false;
    @Output() protected cancelProgress: EventEmitter<any> = new EventEmitter<any>();

    public setPercentage(value: any, label: string) {
        this.show = true;
        this.labelProgress = label;
        const bar = document.documentElement;
        this.percentage = value;
        bar.style.setProperty("--progress", String(value) + "%");
    }

    public close(): void {
        this.show = false;
    }

    public onCancelProgress(): void {
        this.cancelProgress.emit();
    }
}
