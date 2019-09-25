import runContentfulExport from '../../dist/index'

jest.setTimeout(1000 * 60 * 10)

const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN
const awsAccessKey = process.env.AWS_ACCESS_KEY
const awsSecret = process.env.AWS_SECRET
const awsBucket = process.env.AWS_BUCKET

test('It should export space when used as a library', () => {
  return runContentfulExport({
    spaceId,
    managementToken,
    awsAccessKey,
    awsSecret,
    awsBucket,
    downloadAssets: true,
    saveFile: true
  })
    .catch((multierror) => {
      const errors = multierror.errors.filter((error) => error.hasOwnProperty('error'))
      expect(errors).toHaveLength(0)
    })
    .then((content) => {
      expect(content).toBeTruthy()
      expect(content.contentTypes.length).toBeTruthy()
      expect(content.editorInterfaces.length).toBeTruthy()
      expect(content.entries.length).toBeTruthy()
      expect(content.assets.length).toBeTruthy()
      expect(content.locales.length).toBeTruthy()
      expect(content.webhooks.length).toBeTruthy()
      expect(content.roles.length).toBeTruthy()
    })
})

// test('It should export environment when used as a library', () => {
//   return runContentfulExport({
//     spaceId,
//     managementToken,
//     awsAccessKey,
//     awsSecret,
//     awsBucket,
//     environmentId: 'master',
//     saveFile: true
//   })
//     .catch((multierror) => {
//       const errors = multierror.errors.filter((error) => error.hasOwnProperty('error'))
//       expect(errors).toHaveLength(0)
//     })
//     .then((content) => {
//       expect(content).toBeTruthy()
//       expect(content.contentTypes).toHaveLength(2)
//       expect(content.editorInterfaces).toHaveLength(2)
//       expect(content.entries).toHaveLength(4)
//       expect(content.assets).toHaveLength(4)
//       expect(content.locales).toHaveLength(1)
//       expect(content).not.toHaveProperty('webhooks')
//       expect(content).not.toHaveProperty('roles')
//     })
// })
