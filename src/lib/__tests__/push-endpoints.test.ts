import { describe, it, expect } from 'vitest';
import { isAllowedPushEndpoint } from '@/lib/push-endpoints';

describe('isAllowedPushEndpoint', () => {
  it('przepuszcza usługi push przeglądarek', () => {
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
    expect(isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true);
    expect(isAllowedPushEndpoint('https://wns2-par02p.notify.windows.com/w/?token=abc')).toBe(true);
    expect(isAllowedPushEndpoint('https://web.push.apple.com/abc')).toBe(true);
  });

  it('odrzuca adresy wewnętrzne i obce', () => {
    expect(isAllowedPushEndpoint('https://10.0.0.5:8443/x')).toBe(false);
    expect(isAllowedPushEndpoint('https://localhost/x')).toBe(false);
    expect(isAllowedPushEndpoint('https://example.com/x')).toBe(false);
  });

  it('odrzuca podszywanie się pod domenę i inny protokół lub port', () => {
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com.evil.com/x')).toBe(false);
    expect(isAllowedPushEndpoint('https://evilfcm.googleapis.com.attacker.io/x')).toBe(false);
    expect(isAllowedPushEndpoint('http://fcm.googleapis.com/x')).toBe(false);
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com:8443/x')).toBe(false);
    expect(isAllowedPushEndpoint('https://user:pass@fcm.googleapis.com/x')).toBe(false);
    expect(isAllowedPushEndpoint('nie-url')).toBe(false);
  });
});
