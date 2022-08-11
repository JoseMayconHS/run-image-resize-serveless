'use strict'

const {
	S3Client,
	GetObjectCommand,
	DeleteObjectCommand,
} = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const sharp = require('sharp')
const { basename, extname } = require('path')
const { Blob } = require('buffer')

const S3 = new S3Client()

module.exports.handle = async (event, context) => {
	try {
		const { Records: records } = event

		const Bucket = process.env.BUCKET_NAME
		const ToBucket = process.env.TO_BUCKET_NAME
		const BucketResizedDirectory = process.env.RESIZE_DIRECTORY

		await Promise.all(
			records.map(async (record) => {
				try {
					const { key } = record.s3.object

					if (/[/]users[/]/.test(key)) {
						console.log('Já foi otimizado')
						return {
							status: 200,
						}
					}

					const getCommand = new GetObjectCommand({
						Bucket,
						Key: key,
						ResponseContentType: 'application/octet-stream',
					})

					const image = await S3.send(getCommand)

					const KeyResized = `${BucketResizedDirectory}${basename(
						key,
						extname(key)
					)}.jpg`

					return new Promise(async (resolve) => {
						let chunks = []

						image.Body.on('data', (chunk) => {
							chunks.push(chunk)
						})

						image.Body.on('error', (err) => {
							console.log('error ', err)
							resolve({
								status: 500,
							})
						})

						image.Body.on('end', async () => {
							const blob = new Blob(chunks)

							const resized = await sharp(Buffer.from(await blob.arrayBuffer()))
								.resize({
									width: 180,
									height: 180,
									fit: 'inside',
									withoutEnlargement: true,
								})
								.jpeg({ quality: 90, progressive: true })
								.toBuffer()

							const parallelUploads3 = new Upload({
								client: S3,
								params: {
									Bucket: ToBucket,
									ContentType: 'image/jpeg',
									ACL: 'public-read',
									Key: KeyResized,
									Body: resized,
								},
								queueSize: 4,
								partSize: 1024 * 1024 * 10,
								leavePartsOnError: false,
							})

							await parallelUploads3.done()

							const deleteCommand = new DeleteObjectCommand({
								Bucket,
								Key: key,
							})

							await S3.send(deleteCommand)

							resolve({
								status: 301,
								body: {},
							})
						})
					})
				} catch (e) {
					console.log('Catch()', e)
					return e
				}
			})
		)
	} catch (e) {
		return {
			status: 500,
			body: JSON.stringify({
				errorMessage: e.message,
			}),
		}
	}
}
