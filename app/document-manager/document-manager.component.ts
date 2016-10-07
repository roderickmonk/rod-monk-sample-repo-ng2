/// <reference path="../../typings/globals/require/index.d.ts" />

import { Component, ViewChild, OnInit }    
                                from '@angular/core';
import { Response }             from '@angular/http';
import { Router }               from '@angular/router-deprecated';
import { MD_PROGRESS_BAR_DIRECTIVES } 
                                from '@angular2-material/progress-bar';

import { DocumentService }      from '../services/document.service';
import { UserService }          from '../services/user.service';
import { LogService }           from '../services/log.service';
import { MessageComponent }     from '../message/message.component';
import * as constant            from '../constants';

@Component({
    selector: 'document-manager',
    template: require('./document-manager.component.html'),
    directives: [MessageComponent, MD_PROGRESS_BAR_DIRECTIVES]
})

export class DocumentManagerComponent implements OnInit {

    @ViewChild(MessageComponent) message: MessageComponent;

    documentsToUpload: Array<File>;

    documents: any[];
    IsVisible = false;
    isLoading: boolean = false;

    constructor(
        private documentService: DocumentService,
        private logService: LogService,
        public userService: UserService,
        private router: Router
    ) {
        this.documentsToUpload = [];
    }

    private handleError = (err: Response) => {
        if (err.status === 440) {
            this.router.navigate(['Home']);
            this.userService.loggedOut();
            this.message.showMessage(constant.SESSION_TIMEOUT);
        } else {
            this.logService.logMessage('Server Failure: ' + JSON.stringify(err, null, 4));
            this.message.showMessage(constant.SOFTWARE_FAILURE);
        }
    }

    upload = () => {
        this.isLoading = true;
        this.documentService.uploadDocuments(this.documentsToUpload)
            .then((documents: any[]) => this.documents = documents)
            .catch((err: Response) => this.handleError(err))
            .then(() => this.isLoading = false);
    }

    fileChangeEvent = (fileInput: any) =>
        this.documentsToUpload = <Array<File>>fileInput.target.files;

    refreshDocumentList = () => {
        this.isLoading = true;
        this.documentService.refreshDocumentList().subscribe(
            documents => { this.documents = documents; this.isLoading = false; },
            error => { this.isLoading = false; this.handleError(error); });
    }

    removeDocument = (document: any) => {
        this.documentService.removeDocument(document._id).subscribe(
            documents => { this.documents = documents; this.isLoading = false; },
            error => { this.isLoading = false; this.handleError(error); });
    }

    messageClosed = () => _.noop;

    ngOnInit() {
        this.refreshDocumentList();
    }
}
