/// <reference path="../../typings/globals/require/index.d.ts" />

import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'communications-consent-modal',
    template: require('./communications-consent.modal.html')
})

export class CommunicationsConsentComponent {

    @Output() onClosed = new EventEmitter<boolean>();

    IsVisible: boolean = false;

    showModal() {
        this.IsVisible = true;
    }

    hideModal() {
        this.IsVisible = false;
        this.onClosed.emit(true);
    }
}
