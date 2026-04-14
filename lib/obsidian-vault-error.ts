export class ObsidianVaultConfigurationError extends Error {
  readonly code = "OBSIDIAN_VAULT_CONFIG" as const;

  constructor(message: string) {
    super(message);
    this.name = "ObsidianVaultConfigurationError";
  }
}
