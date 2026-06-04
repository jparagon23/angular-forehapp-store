import { AbstractControl, ValidationErrors } from '@angular/forms';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Common disposable / temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
  'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf', 'moncourrier.fr.nf',
  'monemail.fr.nf', 'monmail.fr.nf',
  'mailinator.com', 'mailinator2.com', 'notmailinator.com', 'suremail.info',
  'spamhereplease.com', 'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.biz', 'guerrillamailblock.com',
  'grr.la', 'sharklasers.com', 'spam4.me', 'spamfree24.org',
  'tempmail.com', 'tempmail.net', 'tempmail.de', 'temp-mail.org', 'temp-mail.ru',
  'tempr.email', 'discard.email',
  '10minutemail.com', '10minutemail.net', '10minutemail.org', '10minutemail.de',
  '10minutemail.nl', '10minutemail.ru', '10minutemail.us', '10minutemail.co.uk',
  'throwam.com', 'throw.me.uk', 'throwam.com',
  'trashmail.com', 'trashmail.me', 'trashmail.net', 'trashmail.at',
  'trashmail.io', 'trashmail.org', 'trashmail.xyz',
  'dispostable.com', 'disposableemailaddresses.com', 'disposableaddress.com',
  'maildrop.cc', 'mailnesia.com', 'mailnull.com', 'mailsac.com',
  'fakeinbox.com', 'fakeinbox.net', 'fakemail.fr', 'fakemailz.com',
  'mailforspam.com', 'spambox.us', 'spamspot.com',
  'dodgeit.com', 'spamfree.eu', 'spamfree24.de', 'spamfree24.eu',
  'getairmail.com', 'mailtemp.info', 'mytrashmail.com',
  'jetable.net', 'jetable.org', 'jetable.com',
  'filzmail.com', 'filzmail.de', 'fake-box.com',
  'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'binkmail.com', 'bobmail.info', 'cheatmail.de',
  'mt2009.com', 'mt2014.com', 'dayrep.com',
  'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com',
  'superrito.com', 'teleworm.us', 'armyspy.com', 'cuvox.de', 'dayrep.com',
  'einrot.de', 'fleckens.hu', 'gustr.com', 'harakirimail.com', 'mailexpire.com',
  'spamgob.com', 'mailmetrash.com', 'incognitomail.com', 'incognitomail.net',
  'incognitomail.org', 'mailnew.com', 'one-time.email', 'opentrash.com',
  'pop3.xyz', 'prtnx.com', 'throwam.com', 'uroid.com', 'vomoto.com',
  'anonmails.de', 'spam.la', 'spamgob.com', 'spamthisplease.com',
  'meltmail.com', 'mailforspam.com', 'no-spam.ws', 'nobulk.com',
  'nospam4.us', 'nospamfor.us', 'nospammail.net',
  'owlpic.com', 'pancakemail.com', 'pookmail.com',
  'spamavert.com', 'spamhereplease.com', 'spamoff.de',
  'tempemail.net', 'tempinbox.com', 'tempinbox.co.uk',
  'temporaryemail.net', 'temporaryforwarding.com', 'temporaryinbox.com',
  'thanksnospam.info', 'throwam.com', 'trashdevil.com', 'trashdevil.de',
  'trashemail.de', 'trashimail.net', 'trbvm.com', 'turual.com',
  'twinmail.de', 'twoweirdtricks.com', 'tyldd.com', 'uggsrock.com',
  'uroid.com', 'venompen.com', 'viditag.com', 'vomoto.com',
  'wasteland.rfc822.org', 'wetrainbayarea.com', 'wetrainbayarea.org',
  'wilemail.com', 'willhackforfood.biz', 'willselfdestruct.com',
  'wuzupmail.net', 'xagloo.com', 'xemaps.com', 'xents.com',
  'xmaily.com', 'xoxy.net', 'yep.it', 'yogamaven.com', 'yopmail.pp.ua',
  'yopmail.fr', 'ypmail.webarnak.fr.eu.org', 'yuurok.com',
  'zehnminuten.de', 'zehnminutenmail.de', 'zippymail.info',
  'zoemail.net', 'zoemail.org', 'zomg.info',
]);

export type EmailValidationResult = 'valid' | 'invalid-format' | 'disposable';

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isDisposableEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  return DISPOSABLE_DOMAINS.has(parts[1]);
}

export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim();
  if (!isValidEmailFormat(trimmed)) return 'invalid-format';
  if (isDisposableEmail(trimmed)) return 'disposable';
  return 'valid';
}

export function emailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const result = validateEmail(control.value);
  if (result === 'invalid-format') return { emailFormat: true };
  if (result === 'disposable') return { disposableEmail: true };
  return null;
}
