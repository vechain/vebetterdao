import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager"

/**
 * Retrieves a secret from AWS Secrets Manager
 * @param secretId - The ID of the secret to retrieve
 * @param key - The key of the secret value to retrieve
 * @returns The secret value
 */
export async function getSecret(client: SecretsManagerClient, secretId: string, key: string): Promise<string> {
  const data = await client.send(new GetSecretValueCommand({ SecretId: secretId }))

  if (data.SecretString) {
    return JSON.parse(data.SecretString)[key]
  }

  throw new Error("Secret not found or invalid")
}
