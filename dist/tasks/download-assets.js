'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = downloadAssets;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _figures = require('figures');

var _figures2 = _interopRequireDefault(_figures);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _getEntityName = require('contentful-batch-libs/dist/get-entity-name');

var _getEntityName2 = _interopRequireDefault(_getEntityName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function downloadAsset(url, config) {
  return new _bluebird2.default(function (resolve, reject) {
    // build local file path from the url for the download
    var urlParts = url.split('//');

    var localFile = urlParts[urlParts.length - 1];

    // handle urls without protocol
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }

    const Bucket = config.awsBucket;
    const Key = `${config.folderName}/assets/${localFile}`;

    _awsSdk2.default.config.update({
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecret
    });

    const s3 = new _awsSdk2.default.S3({
      apiVersion: '2006-03-01',
      region: config.awsRegion || 'us-east-1'
    });

    // download asset
    var assetRequest = _request2.default.get(url);
    assetRequest.on('response', response => {
      // handle error response
      if (response.statusCode >= 400) {
        reject(new Error('error response status: ' + response.statusCode));
      }

      s3.upload({ Bucket, Key, Body: response }).promise().then(() => resolve(localFile)).catch(reject);
    });

    // handle request errors
    assetRequest.on('error', error => {
      reject(error);
    });
  });
}

function downloadAssets(options) {
  return (ctx, task) => {
    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    return _bluebird2.default.map(ctx.data.assets, asset => {
      if (!asset.fields.file) {
        task.output = `${_figures2.default.warning} asset ${(0, _getEntityName2.default)(asset)} has no file(s)`;
        warningCount++;
        return;
      }
      const locales = Object.keys(asset.fields.file);
      return _bluebird2.default.mapSeries(locales, locale => {
        const url = asset.fields.file[locale].url || asset.fields.file[locale].upload;
        return downloadAsset(url, options).then(downLoadedFile => {
          task.output = `${_figures2.default.tick} downloaded ${(0, _getEntityName2.default)(downLoadedFile)} (${url})`;
          successCount++;
        }).catch(error => {
          task.output = `${_figures2.default.cross} error downloading ${url}: ${error.message}`;
          errorCount++;
        });
      });
    }, {
      concurrency: 6
    }).then(() => {
      ctx.assetDownloads = {
        successCount,
        warningCount,
        errorCount
      };
    });
  };
}
module.exports = exports['default'];