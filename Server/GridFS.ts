/// <reference path="../typings/globals/node/index.d.ts" />

const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fs = require('fs');
const async = require('async');
const conn = mongoose.connection;
const ObjectID = require('mongodb').ObjectID;

export namespace GridFS {

	Grid.mongo = mongoose.mongo;

	conn.on('error', console.error.bind(console, 'connection error:'));

	export const saveFileToDb = (filepath: string, filename: string, category: any, collection_id: any) =>

		new Promise((resolve, reject) => {

			const gfs = Grid(conn.db);
			const writestream = gfs.createWriteStream({
				_id: new ObjectID(),
				filename: filename,
				metadata: { collection_id: collection_id, category: category }
			});
			fs.createReadStream(filepath).pipe(writestream);

			writestream.on('close', (file: any) => resolve(null));
		});

	export const saveFileToDbWithCallback = (file: any, callback: any) =>
		exports.saveFileToDb(file.path, file.originalname, file.category, file.collection_id).then(callback).catch(callback);

	export const saveFiles = (files: any[]) =>
		new Promise((resolve, reject) =>
			async.each(files, exports.saveFileToDbWithCallback, (err: Error) => err ? reject(err) : resolve(null)));

	export const retrieveFileFromDb = (file: any) =>

		new Promise((resolve, reject) => {

			// Create a file with a name of the form 'file._id.<ext>', where <ext> is the extension of the original file
			var filepath = __dirname + '/../' + file._id + '.' + file.filename.substr(file.filename.lastIndexOf('.') + 1);

			// Check whether the file already exists
			fs.open(filepath, 'r', (err: Error, fd: any) => {
				if (!err) {
					// File already exits
					fs.closeSync(fd);
					resolve(null);
				}
				else {
					// File does not exist...create it
					var fs_write_stream = fs.createWriteStream(filepath);

					var gfs = Grid(conn.db);

					// Read from mongodb
					var readstream = gfs.createReadStream({ _id: file._id });
					readstream.pipe(fs_write_stream);
					fs_write_stream.on('close', () => {
						resolve(null);
					});
					fs_write_stream.on('error', () => {
						err = Error('file creation error: ' + filepath);
						reject(err);
					});
				}
			});
		});

	export const removeFileFromDb = (_id: string) =>
		new Promise((resolve, reject) =>
			Grid(conn.db).remove({ _id: _id }, (err: Error) => err ? reject(err) : resolve(null)));

	// Required for async.each
	const removeFileFromDbWithCallback = (file: any, callback: any) =>
		removeFileFromDb(file._id).then(callback).catch(callback);

	export const listDocumentFiles = () =>
		new Promise((resolve, reject) =>
			Grid(conn.db).files.find({}).toArray((err: Error, files: any[]) => {
				if (err) {
					reject(err);
				}
				else {
					// Select only the 'document' category
					var Documents: any[] = [];
					files.forEach((file: any) => {
						if (file.metadata.category === 'document')
							Documents.push(file);
					});
					resolve(Documents);
				}
			})
		);

	// Required for async.each
	const retrieveFileFromDbWithCallback = (file: string, callback: any) =>
		retrieveFileFromDb(file).then(callback).catch(callback);

	export const retrieveAllDocuments = () =>
		new Promise((resolve, reject) =>
			listDocumentFiles()
				.then((Documents: any) =>
					async.each(Documents, retrieveFileFromDbWithCallback, (err: Error) => err ? reject(err) : resolve(Documents)))
				.catch(reject));

	export const listNewsItemFiles = (newsitemid: string) =>

		new Promise((resolve, reject) => {

			var gfs = Grid(conn.db);
			gfs.files.find({}).toArray((err: Error, files: any[]) => {
				if (err) {
					reject(err);
				} else {
					const NewsItemFiles: any[] = [];
					files.forEach(file => {
						if (file.metadata.category === 'newsitem' && file.metadata.collection_id === newsitemid) {
							NewsItemFiles.push(file);
						}
					});
					resolve(NewsItemFiles);
				}
			});
		});

	export const retrieveNewsItemFiles = (newsitemid: string) =>
		new Promise((resolve, reject) =>
			listNewsItemFiles(newsitemid)
				.then((NewsItemFiles: any[]) =>
					async.each(NewsItemFiles, retrieveFileFromDbWithCallback, (err: Error) => err ? reject(err) : resolve(NewsItemFiles))));

	export const deleteNewsItemFiles = (newsitemid: string) =>
		new Promise((resolve, reject) =>
			listNewsItemFiles(newsitemid)
				.then((NewsItemFiles: any[]) =>
					async.each(NewsItemFiles, removeFileFromDbWithCallback, (err: Error) => err ? reject(err) : resolve(null))));
}
