const { writeFile } = require('fs').promises
const Ceramic = require('@ceramicnetwork/http-client').default
const { createDefinition, publishSchema } = require('@ceramicstudio/idx-tools')
const { Ed25519Provider } = require('key-did-provider-ed25519')
const ThreeIdResolver = require('@ceramicnetwork/3id-did-resolver').default
const KeyDidResolver = require('key-did-resolver').default
const { Resolver } = require('did-resolver')
const { DID } = require('dids')
const fromString = require('uint8arrays/from-string')

const CERAMIC_URL = 'http://localhost:7007'

const EncryptedNoteSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'EncryptedNote',
  type: 'object',
  properties: {
    protected: { type: 'string' },
    iv: { type: 'string' },
    ciphertext: { type: 'string' },
    tag: { type: 'string' },
    aad: { type: 'string' },
    recipients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          header: {
            type: 'object',
            properties: {
              alg: { type: 'string' },
              iv: { type: 'string' },
              tag: { type: 'string' },
              epk: { type: 'object' },
              kid: { type: 'string' },
            },
            required: ['alg', 'iv', 'tag'],
          },
          encrypted_key: { type: 'string' },
        },
        required: ['header', 'encrypted_key'],
      },
    },
  },
  required: ['protected', 'iv', 'ciphertext', 'tag'],
}

const NotesListSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'NotesList',
  type: 'object',
  properties: {
    notes: {
      type: 'array',
      title: 'notes',
      items: {
        type: 'object',
        title: 'EncryptedNoteItem',
        properties: {
          id: {
            $ref: '#/definitions/CeramicStreamId',
          },
          title: {
            type: 'string',
            title: 'title',
            maxLength: 100,
          },
        },
      },
    },
  },
  definitions: {
    CeramicStreamId: {
      type: 'string',
      pattern: '^ceramic://.+(\\\\?version=.+)?',
      maxLength: 150,
    },
  },
}

async function run() {
  // The seed must be provided as an environment variable
  const seed = fromString(process.env.SEED, 'base16')
  // Connect to the local Ceramic node
  const ceramic = new Ceramic(CERAMIC_URL)
  // Provide the DID Resolver and Provider to Ceramic
  const resolver = new Resolver({
      ...KeyDidResolver.getResolver(),
      ...ThreeIdResolver.getResolver(ceramic) })
  const provider = new Ed25519Provider(seed)
  const did = new DID({ provider, resolver })
  await ceramic.setDID(did)
  // Authenticate the Ceramic instance with the provider
  await ceramic.did.authenticate()
    

  // Publish the two schemas
  const [noteSchema, notesListSchema] = await Promise.all([
    publishSchema(ceramic, { content: EncryptedNoteSchema }),
    publishSchema(ceramic, { content: NotesListSchema }),
  ])

  // Create the definition using the created schema ID
  const notesDefinition = await createDefinition(ceramic, {
    name: 'encrytped-notes',
    description: 'Encrypted text notes',
    schema: notesListSchema.commitId.toUrl(),
  })

  // Write config to JSON file
  const config = {
    definitions: {
      notes: notesDefinition.id.toString(),
    },
    schemas: {
      EncryptedNote: noteSchema.commitId.toUrl(),
      NotesList: notesListSchema.commitId.toUrl(),
    },
  }
  await writeFile('./src/config.json', JSON.stringify(config))

  console.log('Config written to src/config.json file:', config)
  process.exit(0)
}

run().catch(console.error)