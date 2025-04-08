# Genet Smithy Models

The Genet Service Smithy model consists of:

- Credential Management Service:

  - `/tokens/installation` API endpoint:

    - Retrieves the installation access token
      for a specific App and target installation from
      GitHub based on the App ID and the Node ID as input.

  - `/tokens/app` API endpoint:
    - Retrieves a JWT token for a GitHub App based on the App ID as input.

To build the smithy model and generate the ssdk run the following commands:

```bash
smithy build
```
