import {
  type AuthProvider,
  type SignAppIdParams,
  type SignedAppId,
} from "../auth-method";
import { base64ToBytes } from "../bytes";
import { signTbs } from "../hipki-client";
import type { Pin } from "../pin";

export interface IcCardAuthProviderParams {
  pin: Pin;
  slotDescription?: string;
}

export class IcCardAuthProvider implements AuthProvider {
  private readonly pin: Pin;
  private readonly slotDescription: string | undefined;

  constructor(params: IcCardAuthProviderParams) {
    this.pin = params.pin;
    this.slotDescription = params.slotDescription;
  }

  async signAppId(params: SignAppIdParams): Promise<SignedAppId> {
    // HiPKI popup is not interruptible; signal is re-checked at the pipeline level.
    const sig = await signTbs({
      tbs: params.appId,
      pin: this.pin.consume(),
      slotDescription: this.slotDescription,
    });
    if (sig.ret_code !== 0 || sig.last_error !== 0) {
      throw new Error(
        `HiPKI sign failed: ret_code=${sig.ret_code} last_error=${sig.last_error}`,
      );
    }
    if (!sig.certb64) {
      throw new Error("HiPKI sign response missing certb64");
    }
    // Use the sign-response cert, not the setup cache, to match the signing key.
    return {
      signatureB64: sig.signature,
      userCertDer: base64ToBytes(sig.certb64),
    };
  }
}
