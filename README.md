# contentful-export-aws

This is a fork of the Contentful Export Tool to write the Contentful backup to AWS S3 instead of a local file system.

## Usage

```sh
$ npm install @ewarren/contentful-export-aws
```

```js
const contentfulExport = require('contentful-export')

const options = {
  spaceId: '<space_id>',
  managementToken: '<content_management_api_key>',
  awsAccessKey: '<aws_access_key',
  awsSecret: '<aws_secret>',
  awsRegion: 'us-east-1|<aws_region>',
  awsBucket: '<aws_bucket>',
  ...
};

(async function() {
  await contentfulExport(options);

  console.log('Completed export');
})();
```

# Contentful export tool (Original README)

[![npm](https://img.shields.io/npm/v/contentful-export.svg)](https://www.npmjs.com/package/contentful-export)
[![Build Status](https://travis-ci.org/contentful/contentful-export.svg?branch=master)](https://travis-ci.org/contentful/contentful-export)
[![codecov](https://codecov.io/gh/contentful/contentful-export/branch/master/graph/badge.svg)](https://codecov.io/gh/contentful/contentful-export)
[![Dependency Status](https://img.shields.io/david/contentful/contentful-export.svg)](https://david-dm.org/contentful/contentful-export)
[![devDependency Status](https://img.shields.io/david/dev/contentful/contentful-import.svg)](https://david-dm.org/contentful/contentful-export#info=devDependencies)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[Contentful](https://www.contentful.com) provides a content infrastructure for digital teams to power content in websites, apps, and devices. Unlike a CMS, Contentful was built to integrate with the modern software stack. It offers a central hub for structured content, powerful management and delivery APIs, and a customizable web app that enable developers and content creators to ship digital products faster.

This is a library that help you backup your Content Model, Content and Assets or move them to a new Contentful space. _It will support Roles & Permissions in a future version._

To import your exported data, please refer to the [contentful-import](https://github.com/contentful/contentful-import) repository.

## :exclamation: Usage as CLI
> We moved the CLI version of this tool into our [Contentful CLI](https://github.com/contentful/contentful-cli). This allows our users to use and install only one single CLI tool to get the full Contentful experience.
>
> Please have a look at the [Contentful CLI export command documentation](https://github.com/contentful/contentful-cli/tree/master/docs/space/export) to learn more about how to use this as command line tool.


## :cloud: Installation

```bash
npm install contentful-export
```

## :hand: Usage

```javascript
const contentfulExport = require('contentful-export')

const options = {
  spaceId: '<space_id>',
  managementToken: '<content_management_api_key>',
  ...
}

contentfulExport(options)
  .then((result) => {
    console.log('Your space data:', result)
  })
  .catch((err) => {
    console.log('Oh no! Some errors occurred!', err)
  })
```

### Querying

To scope your export, you are able to pass query parameters. All search parameters of our API are supported as documented in our [API documentation](https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/search-parameters).

```javascript
const contentfulExport = require('contentful-export')

const options = {
  spaceId: '<space_id>',
  managementToken: '<content_management_api_key>',
  queryEntries: 'content_type=<content_type_id>'
}

contentfulExport(options)
...
```

The Export tool also support multiple inline queries.

```javascript
const contentfulExport = require('contentful-export')

const options = {
  spaceId: '<space_id>',
  managementToken: '<content_management_api_key>',
  queryEntries: [
    'content_type=<content_type_id>',
    'sys.id=<entry_id>'
  ]
}

contentfulExport(options)
...
```

`queryAssets` uses the same syntax as `queryEntries`

### Export an environment

```javascript
const contentfulExport = require('contentful-export')

const options = {
  spaceId: '<space_id>',
  managementToken: '<content_management_api_key>',
  environmentId: '<environment_id>'
}

contentfulExport(options)
...
```

## :gear: Configuration options

### Basics

#### `spaceId` [string] [required]
ID of the space with source data

#### `environmentId` [string] [default: 'master']
ID of the environment in the source space

#### `managementToken` [string] [required]
Contentful management API token for the space to be exported

### Output

#### `exportDir` [string] [default: current process working directory]
Defines the path for storing the export JSON file

#### `saveFile` [boolean] [default: true]
Save the export as a JSON file

#### `contentFile` [string]
The filename for the exported data

### Filtering

#### `includeDrafts` [boolean] [default: false]
Include drafts in the exported entries

#### `includeArchived` [boolean] [default: false]
Include archived entries in the exported entries

#### `skipContentModel` [boolean] [default: false]
Skip exporting content models

#### `skipContent` [boolean] [default: false]
Skip exporting assets and entries

#### `skipRoles` [boolean] [default: false]
Skip exporting roles and permissions

#### `skipWebhooks` [boolean] [default: false]
Skip exporting webhooks

#### `contentOnly` [boolean] [default: false]
Only export entries and assets

#### `queryEntries` [array]
Only export entries that match these queries

#### `queryAssets` [array]
Only export assets that match these queries

#### `downloadAssets` [boolean]
Download actual asset files

### Connection

#### `host` [string] [default: 'api.contentful.com']
The Management API host

#### `proxy` [string]
Proxy configuration in HTTP auth format: `host:port` or `user:password@host:port`

#### `rawProxy` [boolean]
Pass proxy config to Axios instead of creating a custom httpsAgent

#### `maxAllowedLimit` [number] [default: 1000]
The number of items per page per request

### Other

#### `errorLogFile` [string]
Full path to the error log file

#### `useVerboseRenderer` [boolean] [default: false]
Display progress in new lines instead of displaying a busy spinner and the status in the same line. Useful for CI.

## :rescue_worker_helmet: Troubleshooting

*  Unable to connect to Contentful through your proxy? Try to set the `rawProxy` option to `true`.

```javascript
contentfulExport({
  proxy: 'https://cat:dog@example.com:1234',
  rawProxy: true,
  ...
})
```

## :card_file_box: Exported data structure

This is an overview of the exported data:

```json
{
  "contentTypes": [],
  "entries": [],
  "assets": [],
  "locales": [],
  "webhooks": [],
  "roles": [],
  "editorInterfaces": []
}
```

## :warning: Limitations

- This tool currently does **not** support the export of space memberships.
- Exported webhooks with credentials will be exported as normal webhooks. Credentials should be added manually afterwards.
- If you have custom UI extensions, you need to reinstall them manually in the new space.

## :memo: Changelog

Read the [releases](https://github.com/contentful/contentful-export/releases) page for more information.

## :scroll: License

This project is licensed under MIT license

[1]: https://www.contentful.com
