export interface SignedAppId {
  /** Raw RSA PKCS#1 v1.5 signature (not CMS / PKCS#7). */
  signatureB64: string;
  /** X.509 cert of the signing key. */
  userCertDer: Uint8Array;
}

export interface SignAppIdParams {
  /** `app_id` payload from the verifier challenge (UTF-8 string, not hex). */
  appId: string;
  signal?: AbortSignal;
}

export interface AuthProvider {
  signAppId(params: SignAppIdParams): Promise<SignedAppId>;
}
