import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { URLS } from '../../../app/app.urls';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-token',
    templateUrl: './token.component.html'
})
export class TokenComponent extends BaseComponent<any> implements OnInit {

    constructor(public injector: Injector) {
        super(injector, {
            endpoint: URLS.TOKEN,
            searchOnInit: true,
            associative: true,
            associativeRoute: 'tokens/refresh'
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    createFormGroup(): void {
        this.formGroup = this.formBuilder.group({
            userId: [null, [Validators.required]],
            tokenType: ['API', [Validators.required]],
            expiresAt: [null, [Validators.required]],
            lastUsed: [null],
            scopes: [[]],
            isActive: [true]
        });
    }

    public search(): void {
        this.service.clearParameter();
        if (this.f.userId.value) {
            this.service.addParameter('user_id', this.f.userId.value);
        }
        if (this.f.tokenType.value) {
            this.service.addParameter('token_type', this.f.tokenType.value);
        }
        if (this.f.isActive.value !== null) {
            this.service.addParameter('is_active', this.f.isActive.value);
        }
        super.search();
    }

    public refreshToken(tokenId: string): void {
        this.service.postFromDetailRoute(tokenId, 'refresh', {}).subscribe(() => {
            this.toast.success('refresh-success', 'token-refreshed');
            this.search();
        });
    }

    public revokeToken(tokenId: number): void {
        const description = `Revoke access for token ${tokenId}`;
        this.delete(tokenId, description, (event) => {
            this.search();
        });
    }

    public saveToken(): void {
        if (this.f.expiresAt.value && new Date(this.f.expiresAt.value) < new Date()) {
            this.toast.error('invalid-expiry', 'token-expiry-future');
            return;
        }
        super.saveOrUpdate();
    }

}
