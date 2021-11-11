'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = runContentfulExport;

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _bfj = require('bfj');

var _bfj2 = _interopRequireDefault(_bfj);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _cliTable = require('cli-table3');

var _cliTable2 = _interopRequireDefault(_cliTable);

var _listr = require('listr');

var _listr2 = _interopRequireDefault(_listr);

var _listrUpdateRenderer = require('listr-update-renderer');

var _listrUpdateRenderer2 = _interopRequireDefault(_listrUpdateRenderer);

var _listrVerboseRenderer = require('listr-verbose-renderer');

var _listrVerboseRenderer2 = _interopRequireDefault(_listrVerboseRenderer);

var _lodash = require('lodash');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _listr3 = require('contentful-batch-libs/dist/listr');

var _logging = require('contentful-batch-libs/dist/logging');

var _downloadAssets = require('./tasks/download-assets');

var _downloadAssets2 = _interopRequireDefault(_downloadAssets);

var _getSpaceData = require('./tasks/get-space-data');

var _getSpaceData2 = _interopRequireDefault(_getSpaceData);

var _initClient = require('./tasks/init-client');

var _initClient2 = _interopRequireDefault(_initClient);

var _parseOptions = require('./parseOptions');

var _parseOptions2 = _interopRequireDefault(_parseOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _bluebird2.default.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function createListrOptions(options) {
  if (options.useVerboseRenderer) {
    return {
      renderer: _listrVerboseRenderer2.default
    };
  }
  return {
    renderer: _listrUpdateRenderer2.default,
    collapse: false
  };
}

function runContentfulExport(params) {
  const log = [];
  params.folderName = params.folderName || new Date().toString();
  const options = (0, _parseOptions2.default)(params);

  const listrOptions = createListrOptions(options);

  // Setup custom error listener to store errors for later
  (0, _logging.setupLogging)(log);

  const tasks = new _listr2.default([{
    title: 'Initialize client',
    task: (0, _listr3.wrapTask)(ctx => {
      try {
        // CMA client
        ctx.client = (0, _initClient2.default)(options);
        if (options.deliveryToken) {
          // CDA client for fetching only public entries
          ctx.cdaClient = (0, _initClient2.default)(options, true);
        }
        return _bluebird2.default.resolve();
      } catch (err) {
        return _bluebird2.default.reject(err);
      }
    })
  }, {
    title: 'Fetching data from space',
    task: ctx => {
      return (0, _getSpaceData2.default)({
        client: ctx.client,
        cdaClient: ctx.cdaClient,
        spaceId: options.spaceId,
        environmentId: options.environmentId,
        maxAllowedLimit: options.maxAllowedLimit,
        includeDrafts: options.includeDrafts,
        includeArchived: options.includeArchived,
        skipContentModel: options.skipContentModel,
        skipEditorInterfaces: options.skipEditorInterfaces,
        skipContent: options.skipContent,
        skipWebhooks: options.skipWebhooks,
        skipRoles: options.skipRoles,
        listrOptions,
        queryEntries: options.queryEntries,
        queryAssets: options.queryAssets
      });
    }
  }, {
    title: 'Write assets to S3',
    task: (0, _listr3.wrapTask)((0, _downloadAssets2.default)(options)),
    skip: ctx => !options.downloadAssets || !ctx.data.hasOwnProperty('assets')
  }, {
    title: 'Write export data to S3',
    task: (() => {
      var _ref = _asyncToGenerator(function* (ctx) {
        // const stream = bfj.streamify(ctx.data, {
        //   circular: 'ignore',
        //   space: 2
        // })
        const json = yield _bfj2.default.stringify(ctx.data, {
          circular: 'ignore',
          space: 2
        });

        const Bucket = options.awsBucket;
        const Key = `${options.folderName}/export.json`;

        _awsSdk2.default.config.update({
          accessKeyId: options.awsAccessKey,
          secretAccessKey: options.awsSecret
        });

        const s3 = new _awsSdk2.default.S3({
          apiVersion: '2006-03-01',
          region: options.awsRegion || 'us-east-1'
        });

        return s3.upload({ Bucket, Key, Body: json }).promise();
      });

      return function task(_x) {
        return _ref.apply(this, arguments);
      };
    })(),
    skip: () => !options.saveFile
  }], listrOptions);

  return tasks.run({
    data: {}
  }).then(ctx => {
    const resultTypes = Object.keys(ctx.data);
    if (resultTypes.length) {
      const resultTable = new _cliTable2.default();

      resultTable.push([{ colSpan: 2, content: 'Exported entities' }]);

      resultTypes.forEach(type => {
        resultTable.push([(0, _lodash.startCase)(type), ctx.data[type].length]);
      });

      console.log(resultTable.toString());
    } else {
      console.log('No data was exported');
    }

    if ('assetDownloads' in ctx) {
      const downloadsTable = new _cliTable2.default();
      downloadsTable.push([{ colSpan: 2, content: 'Asset file download results' }]);
      downloadsTable.push(['Successful', ctx.assetDownloads.successCount]);
      downloadsTable.push(['Warnings ', ctx.assetDownloads.warningCount]);
      downloadsTable.push(['Errors ', ctx.assetDownloads.errorCount]);
      console.log(downloadsTable.toString());
    }

    const durationHuman = options.startTime.fromNow(true);
    const durationSeconds = (0, _moment2.default)().diff(options.startTime, 'seconds');

    console.log(`The export took ${durationHuman} (${durationSeconds}s)`);
    if (options.saveFile) {
      console.log(`\nStored space data to json file at: ${options.logFilePath}`);
    }
    return ctx.data;
  }).catch(err => {
    log.push({
      ts: new Date().toJSON(),
      level: 'error',
      error: err
    });
  }).then(data => {
    // @todo this should life in batch libs
    const errorLog = log.filter(logMessage => logMessage.level !== 'info' && logMessage.level !== 'warning');
    const displayLog = log.filter(logMessage => logMessage.level !== 'info');
    (0, _logging.displayErrorLog)(displayLog);

    if (errorLog.length) {
      return (0, _logging.writeErrorLogFile)(options.errorLogFile, errorLog).then(() => {
        const multiError = new Error('Errors occured');
        multiError.name = 'ContentfulMultiError';
        multiError.errors = errorLog;
        throw multiError;
      });
    }

    console.log('The export was successful.');

    return data;
  });
}
module.exports = exports['default'];