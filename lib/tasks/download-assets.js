import Promise from 'bluebird'
import figures from 'figures'
import AWS from 'aws-sdk'
import request from 'request'

import getEntityName from 'contentful-batch-libs/dist/get-entity-name'

function downloadAsset (url, config) {
  return new Promise(function (resolve, reject) {
    // build local file path from the url for the download
    var urlParts = url.split('//')

    var localFile = urlParts[urlParts.length - 1]

    // handle urls without protocol
    if (url.startsWith('//')) {
      url = 'https:' + url
    }

    const Bucket = config.awsBucket
    const Key = `${config.folderName}/assets/${localFile}`

    AWS.config.update({
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecret
    })

    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      region: config.awsRegion || 'us-east-1'
    })

    // download asset
    var assetRequest = request.get(url)
    assetRequest.on('response', (response) => {
      // handle error response
      if (response.statusCode >= 400) {
        reject(new Error('error response status: ' + response.statusCode))
      }

      s3.upload({ Bucket, Key, Body: response })
        .promise()
        .then(() => resolve(localFile))
        .catch(reject)
    })

    // handle request errors
    assetRequest.on('error', (error) => {
      reject(error)
    })
  })
}

export default function downloadAssets (options) {
  return (ctx, task) => {
    let successCount = 0
    let warningCount = 0
    let errorCount = 0

    return Promise.map(ctx.data.assets, (asset) => {
      if (!asset.fields.file) {
        task.output = `${figures.warning} asset ${getEntityName(asset)} has no file(s)`
        warningCount++
        return
      }
      const locales = Object.keys(asset.fields.file)
      return Promise.mapSeries(locales, (locale) => {
        const url = asset.fields.file[locale].url || asset.fields.file[locale].upload
        return downloadAsset(url, options)
          .then((downLoadedFile) => {
            task.output = `${figures.tick} downloaded ${getEntityName(downLoadedFile)} (${url})`
            successCount++
          })
          .catch((error) => {
            task.output = `${figures.cross} error downloading ${url}: ${error.message}`
            errorCount++
          })
      })
    }, {
      concurrency: 6
    })
      .then(() => {
        ctx.assetDownloads = {
          successCount,
          warningCount,
          errorCount
        }
      })
  }
}
