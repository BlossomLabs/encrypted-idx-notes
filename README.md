# Encrypted Notes with IDX

This project is based on [How to build a simple notes app with IDX](https://blog.ceramic.network/how-to-build-a-simple-notes-app-with-idx/) and [How to store encrypted secrets using IDX](https://blog.ceramic.network/how-to-store-encrypted-secrets-using-idx/) articles.

We changed the Schema for Notes to use a JWE format, so we have the same functionality as in the simple notes app, but the notes' plaintext is never stored in Ceramic or IDX. We encrypt the notes using `ceramic.did.createJWE` when we save a draft or a note and decrypt them using `ceramic.did.decryptJWE` during opening.

## Instructions to use
1. Install Ceramic and IDX CLIs: `npm install -g @ceramicnetwork/cli @ceramicstudio/idx-cli` (they require node 14+ and npm 6+).
2. Bootstrap Ceramic and IDX with `ceramic daemon` and `idx bootstrap`.
3. Download this repo, install it with `npm install` and start the server with `npm start`.
