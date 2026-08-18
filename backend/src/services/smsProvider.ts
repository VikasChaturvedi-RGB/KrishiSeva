/**
 * SMS provider abstraction.
 *
 * Ships with a MOCK implementation that logs the OTP to the server console instead of
 * sending a real SMS. This lets the whole registration/login flow be demoed end-to-end
 * without any SMS gateway account.
 *
 * To go live: implement `sendSms` against a real provider (MSG91, Gupshup, Twilio,
 * AWS SNS/Pinpoint, Karix, etc.), read SMS_PROVIDER / SMS_PROVIDER_API_KEY from env,
 * and swap the export below. Do not remove the interface — routes/services depend on
 * it, not on any specific vendor SDK.
 */

export interface SmsProvider {
  sendSms(mobileNumber: string, message: string): Promise<{ success: boolean; providerRef?: string }>;
}

class MockSmsProvider implements SmsProvider {
  async sendSms(mobileNumber: string, message: string): Promise<{ success: boolean; providerRef?: string }> {
    // DEV-ONLY: prints to server logs. Replace before handling real farmer phone numbers.
    // eslint-disable-next-line no-console
    console.log(`[MOCK SMS -> ${mobileNumber}] ${message}`);
    return { success: true, providerRef: `mock-${Date.now()}` };
  }
}

function buildProvider(): SmsProvider {
  const providerName = process.env.SMS_PROVIDER || "mock";
  switch (providerName) {
    // case "msg91": return new Msg91Provider(process.env.SMS_PROVIDER_API_KEY!);
    // case "twilio": return new TwilioProvider(process.env.SMS_PROVIDER_API_KEY!);
    case "mock":
    default:
      return new MockSmsProvider();
  }
}

export const smsProvider: SmsProvider = buildProvider();
