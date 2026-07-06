/**
 * Type stubs for packages that are declared in package.json but whose
 * node_modules directory is root-owned and cannot be installed in the
 * local dev environment (they are installed inside the Docker container).
 *
 * These stubs provide just enough type information for tsc --noEmit to pass
 * on the host machine. The real implementations are used at runtime in Docker.
 *
 * Remove this file once node_modules is user-owned and packages are installed.
 */

// expo-auth-session v7 — PKCE authorization-code flow
declare module "expo-auth-session" {
  export function makeRedirectUri(options?: {
    scheme?: string;
    path?: string;
    useProxy?: boolean;
    native?: string;
  }): string;

  export enum ResponseType {
    Code = "code",
    Token = "token",
    IdToken = "id_token",
  }

  export interface DiscoveryDocument {
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    revocationEndpoint?: string;
    endSessionEndpoint?: string;
    [key: string]: unknown;
  }

  export interface AuthRequestConfig {
    clientId: string;
    scopes: string[];
    redirectUri: string;
    usePKCE?: boolean;
    responseType?: ResponseType | string;
    extraParams?: Record<string, string>;
    prompt?: string;
  }

  export type AuthSessionResult =
    | {
        type: "success";
        params: Record<string, string>;
        url?: string;
      }
    | {
        type: "cancel" | "dismiss" | "locked" | "error";
        url?: string;
        error?: { code?: string; description?: string } | null;
      };

  export class AuthRequest {
    constructor(config: AuthRequestConfig);
    /** CSRF/state token — populated after makeAuthUrlAsync()/promptAsync(). */
    state: string;
    /** Built authorization URL — null until makeAuthUrlAsync()/promptAsync(). */
    url: string | null;
    codeVerifier?: string;
    /** Build the authorization URL (populates codeVerifier + state). */
    makeAuthUrlAsync(discovery: DiscoveryDocument): Promise<string>;
    promptAsync(
      discovery: DiscoveryDocument,
      options?: { useProxy?: boolean; windowFeatures?: Record<string, unknown> }
    ): Promise<AuthSessionResult>;
  }

  export interface TokenResponseConfig {
    clientId: string;
    code: string;
    redirectUri: string;
    extraParams?: Record<string, string>;
  }

  export interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
    tokenType?: string;
    issuedAt?: number;
  }

  export function exchangeCodeAsync(
    config: TokenResponseConfig,
    discovery: DiscoveryDocument
  ): Promise<TokenResponse>;
}

// expo-crypto — cryptographic utilities (kept for any remaining callers)
declare module "expo-crypto" {
  export enum CryptoDigestAlgorithm {
    SHA256 = "SHA-256",
    SHA512 = "SHA-512",
    MD5 = "MD5",
    SHA1 = "SHA-1",
    SHA384 = "SHA-384",
  }

  export enum CryptoEncoding {
    BASE64 = "base64",
    HEX = "hex",
  }

  export function getRandomBytesAsync(byteCount: number): Promise<Uint8Array>;

  export function digestStringAsync(
    algorithm: CryptoDigestAlgorithm,
    data: string,
    options?: { encoding?: CryptoEncoding }
  ): Promise<string>;
}
