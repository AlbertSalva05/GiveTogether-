/* GiveTogether — landing.js. jQuery 3.7. No inline scripts or styles (CSP-safe). */
(function ($, window, document) {
  'use strict';
  if (!$) { return; }

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"'`]/g, function (c) { return ESC[c]; }); }
  function peso(n) { return '₱' + Number(n).toLocaleString('en-PH', { maximumFractionDigits: 0 }); }
  function pct(r, g) { return g > 0 ? Math.min(100, Math.round((r / g) * 100)) : 0; }
  function left(h) { h = Number(h) || 0; if (h <= 0) { return 'Closed'; } if (h < 24) { return h + (h === 1 ? ' hr left' : ' hrs left'); } var d = Math.round(h / 24); return d + (d === 1 ? ' day left' : ' days left'); }
  function slugOk(s) { return /^[a-z0-9-]{1,80}$/.test(String(s)); }

  function card(c) {
    var p = pct(c.raised, c.goal);
    var badge = c.hours_left > 0 && c.hours_left < 24 ? '<span class="badge badge--urgent">' + esc(left(c.hours_left)) + '</span>'
      : p >= 90 ? '<span class="badge badge--success">Almost funded</span>' : '<span class="badge badge--info">Verified</span>';
    var url = 'app.html#/c/' + encodeURIComponent(c.slug);
    return '<li class="campaign-card">' +
      '<div class="campaign-card_media" role="img" aria-label="' + esc(c.image_alt) + '">' +
        '<div class="campaign-card_badges"><span class="badge badge--category">' + esc(c.category) + '</span>' + badge + '</div>' +
        '<span class="campaign-card_file">' + esc(c.image) + '</span></div>' +
      '<div class="campaign-card_body">' +
        '<h3 class="campaign-card_title"><a href="' + url + '">' + esc(c.title) + '</a></h3>' +
        '<p class="campaign-card_by">by ' + esc(c.organiser && c.organiser.name) + ' · ' + esc(c.location) + '</p>' +
        '<p class="campaign-card_amount">' + peso(c.raised) + ' <span class="campaign-card_goal">of ' + peso(c.goal) + '</span></p>' +
        '<div class="progress" role="progressbar" aria-label="' + p + ' percent funded" aria-valuenow="' + p + '" aria-valuemin="0" aria-valuemax="100"><div class="progress_bar' + (p < 50 ? ' progress_bar--low' : '') + '" data-w="' + p + '"></div></div>' +
        '<p class="campaign-card_meta"><span class="campaign-card_pct">' + p + '% funded</span><span>' + Number(c.donors).toLocaleString('en-PH') + ' donors</span><span>' + esc(left(c.hours_left)) + '</span></p>' +
        '<a class="btn btn--secondary btn--block campaign-card_cta" href="app.html#/give/' + encodeURIComponent(c.slug) + '">Give to this campaign</a>' +
      '</div></li>';
  }

  function loadCampaigns() {
    var $list = $('.js-campaigns'), $status = $('.js-feed-status');
    $.ajax({ url: 'data/campaigns.json', dataType: 'json', cache: true, timeout: 10000 })
      .done(function (data) {
        var rows = $.grep((data && data.campaigns) || [], function (c) { return c && typeof c.title === 'string' && slugOk(c.slug) && Number(c.goal) > 0; });
        var featured = $.grep(rows, function (c) { return c.featured; });
        var show = (featured.length ? featured : rows).slice(0, 3);
        $list.html($.map(show, card).join(''));
        $list.find('[data-w]').each(function () { $(this).css('width', Math.max(0, Math.min(100, +$(this).attr('data-w') || 0)) + '%'); });
        $status.text('Live feed · ' + rows.length + ' verified campaigns');
      })
      .fail(function () {
        $list.html('<li class="feed-error"><p>We couldn’t load live campaigns right now.</p><p><a href="app.html">Browse them in the app →</a></p></li>');
        $status.text('Feed unavailable');
      });
  }

  function bindMenu() {
    var $btn = $('.menu-toggle'), $nav = $('#site-nav');
    function set(open) {
      $btn.attr('aria-expanded', String(open));
      $nav.toggleClass('site-nav--open', open);
    }
    $btn.on('click', function () { set($btn.attr('aria-expanded') !== 'true'); });
    $nav.on('click', 'a', function () { set(false); });
    $(document).on('keydown', function (e) { if (e.key === 'Escape' && $btn.attr('aria-expanded') === 'true') { set(false); $btn.trigger('focus'); } });
    $(window).on('resize', function () { if (window.innerWidth >= 1024) { set(false); } });
  }

  function bindScrollState() {
    var $h = $('.site-header');
    var $links = $('.site-nav_list-item');
    var ids = $links.map(function () { return $(this).attr('href'); }).get();
    function onScroll() {
      $h.toggleClass('site-header--scrolled', window.pageYOffset > 8);
      var y = window.pageYOffset + $h.outerHeight() + 48, current = '';
      $.each(ids, function (_, id) { var $s = $(id); if ($s.length && $s.offset().top <= y) { current = id; } });
      $links.each(function () { var on = $(this).attr('href') === current; $(this).toggleClass('site-nav_list-item--active', on); if (on) { $(this).attr('aria-current', 'true'); } else { $(this).removeAttr('aria-current'); } });
    }
    var ticking = false;
    $(window).on('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(function () { onScroll(); ticking = false; }); } });
    onScroll();
  }

  function bindAccordion() {
    $('.accordion').on('click', '.accordion_trigger', function () {
      var $t = $(this), open = $t.attr('aria-expanded') === 'true';
      $('.accordion_trigger').attr('aria-expanded', 'false');
      $('.accordion_panel').attr('hidden', true);
      if (!open) { $t.attr('aria-expanded', 'true'); $('#' + $t.attr('aria-controls')).removeAttr('hidden'); }
    });
  }

  function bindForm() {
    $('.js-demo-form').on('submit', function (e) {
      e.preventDefault();
      var $f = $(this), $email = $f.find('[name="email"]'), $org = $f.find('[name="org"]'), $s = $('#demo-status');
      var email = $.trim($email.val()).slice(0, 120), org = $.trim($org.val()).slice(0, 120);
      var okEmail = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(email), okOrg = org.length >= 2;
      $email.attr('aria-invalid', String(!okEmail));
      $org.attr('aria-invalid', String(!okOrg));
      if (!okEmail || !okOrg) {
        $s.addClass('cta-form_status--error').text(!okEmail ? 'Please enter a valid work email.' : 'Please add your organisation name.');
        (!okEmail ? $email : $org).trigger('focus');
        return;
      }
      // Static build: no network call. A live build POSTs JSON over HTTPS with a CSRF token and server-side validation.
      $s.removeClass('cta-form_status--error').text('Thanks — we’ll email ' + email + ' within one business day.');
      $f[0].reset();
      $email.add($org).attr('aria-invalid', 'false');
    });
  }

  $(function () {
    $('.js-year').text(new Date().getFullYear());
    bindMenu();
    bindScrollState();
    bindAccordion();
    bindForm();
    loadCampaigns();
  });
}(window.jQuery, window, document));
