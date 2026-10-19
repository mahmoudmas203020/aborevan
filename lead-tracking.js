(function () {
  'use strict';

  var ADS_ID = 'AW-18488200665';
  var WHATSAPP_CONVERSION = ADS_ID + '/KplnCIGhto0dENmb7u9E';
  var PHONE_CONVERSION = ADS_ID + '/0BslCIShto0dENmb7u9E';
  var ATTRIBUTION_KEY = 'qahwaji_sabbabin_attribution';
  var REFERENCE_KEY = 'qahwaji_sabbabin_lead_reference';

  function safeSessionGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSessionSet(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      // Tracking must never block contact actions.
    }
  }

  function captureAttribution() {
    var query = new URLSearchParams(window.location.search);
    var keys = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term'];
    var saved = {};
    var previous = safeSessionGet(ATTRIBUTION_KEY);

    if (previous) {
      try {
        saved = JSON.parse(previous) || {};
      } catch (error) {
        saved = {};
      }
    }

    keys.forEach(function (key) {
      var value = query.get(key);
      if (value) saved[key] = value.slice(0, 300);
    });

    if (Object.keys(saved).length) {
      safeSessionSet(ATTRIBUTION_KEY, JSON.stringify(saved));
    }
    return saved;
  }

  function getReference() {
    var existing = safeSessionGet(REFERENCE_KEY);
    if (existing) return existing;

    var now = new Date();
    var date = String(now.getFullYear()).slice(-2) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    var random = Math.random().toString(36).slice(2, 7).toUpperCase();
    var reference = 'QS-' + date + '-' + random;
    safeSessionSet(REFERENCE_KEY, reference);
    return reference;
  }

  function serviceName() {
    var page = window.location.pathname.split('/').pop();
    if (page === 'weddings.html') return 'ضيافة فرح أو مناسبة';
    if (page === 'events.html') return 'ضيافة معرض أو مؤتمر';
    if (page === 'qahwaji-riyadh.html') return 'قهوجي وصبابين في الرياض';
    return 'خدمات قهوجي وصبابين للضيافة';
  }

  function sourceLabel(attribution) {
    if (attribution.gclid || attribution.gbraid || attribution.wbraid) return 'إعلان Google';
    if (attribution.utm_source) return attribution.utm_source;
    return 'الموقع الإلكتروني';
  }

  function buildWhatsAppUrl(href, attribution) {
    var url = new URL(href, window.location.href);
    var lines = [
      'السلام عليكم، أرغب في حجز ' + serviceName() + '.',
      '',
      'نوع المناسبة: ',
      'التاريخ: ',
      'الحي أو موقع القاعة: ',
      'عدد الضيوف التقريبي: ',
      '',
      'مرجع الطلب: ' + getReference(),
      'مصدر الطلب: ' + sourceLabel(attribution)
    ];
    url.searchParams.set('text', lines.join('\n'));
    return url.toString();
  }

  function fireGoogleConversionOnce(key, sendTo) {
    var storageKey = 'qahwaji_sabbabin_conversion_' + key;
    if (safeSessionGet(storageKey)) return;
    safeSessionSet(storageKey, '1');
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {send_to: sendTo});
    }
  }

  function pushIntent(channel, attribution) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'qahwaji_sabbabin_lead_intent',
      contact_channel: channel,
      service: serviceName(),
      lead_reference: getReference(),
      traffic_source: sourceLabel(attribution)
    });
  }

  var attribution = captureAttribution();

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';

    if (href.indexOf('https://wa.me/') === 0 || href.indexOf('https://api.whatsapp.com/') === 0) {
      link.href = buildWhatsAppUrl(href, attribution);
      pushIntent('whatsapp', attribution);
      fireGoogleConversionOnce('whatsapp_intent', WHATSAPP_CONVERSION);
    } else if (href.indexOf('tel:') === 0) {
      pushIntent('phone', attribution);
      fireGoogleConversionOnce('phone_intent', PHONE_CONVERSION);
    }
  }, true);
})();
