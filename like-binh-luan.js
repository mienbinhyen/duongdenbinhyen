/* PACOBOOKS — Like, Bình luận, Lượt xem cho trang tĩnh (Em ECO 2026-11-14)
   Gắn cuối trang: <script src="like-binh-luan.js" data-api="LINK_APPS_SCRIPT" defer></script>
   - Mọi trang có dòng trên: đếm lượt xem (gửi ngầm sau khi trang tải xong, 1 lần/trang/lần vào web)
   - Trang muốn có Thích + Bình luận: đặt thêm <div id="paco-lb"></div> ở vị trí muốn hiện
   - Khung Thích/Bình luận chỉ tải khi người đọc cuộn gần tới → không làm chậm trang
   - Trang có thanh dọc .paco-fixed-menu: thêm nút 👍 Thích trang trên nút Home (1 lần/ngày/trang)
   - Quản lý: trang riêng quan-ly-binh-luan.html */
(function () {
  var me = document.currentScript, API = me && me.getAttribute('data-api');
  if (!API) return;
  var P = (me.getAttribute('data-page') || location.pathname);
  /* keepalive: lệnh gửi được giữ lại và vẫn chạy xong dù khách đóng trang ngay sau khi bấm */
  function post(o) { return fetch(API, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(o) }).then(function (r) { return r.json(); }); }

  /* ---- Lượt xem ---- */
  window.addEventListener('load', function () {
    var k = 'pacoView:' + P; try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (e) {}
    setTimeout(function () {
      var body = JSON.stringify({ a: 'view', p: P });
      if (navigator.sendBeacon) navigator.sendBeacon(API, new Blob([body], { type: 'text/plain' }));
      else fetch(API, { method: 'POST', body: body, keepalive: true });
    }, 1500);
  });

  /* ---- Lấy số liệu trang (dùng chung cho 👍 và khung bình luận, chỉ gọi 1 lần) ---- */
  var DATA = {};
  function getData(k) { k = k || P; return DATA[k] || (DATA[k] = fetch(API + '?a=get&p=' + encodeURIComponent(k)).then(function (r) { return r.json(); }).catch(function () { return { likes: 0, plikes: 0, comments: [] }; })); }

  /* ---- 👍 Thích trang: nút trên cùng thanh dọc (trên nút Home), mỗi máy 1 lần/ngày/trang ---- */
  var menu = document.querySelector('.paco-fixed-menu');
  if (menu) {
    var ps = document.createElement('style');
    ps.textContent = '.paco-plike{display:flex;flex-direction:column;align-items:center;background:none;border:0;padding:0;margin:0;cursor:pointer;line-height:1}' +
      '.paco-plike i{display:flex;align-items:center;justify-content:center;transition:transform .2s}' +
      '.paco-plike svg{width:30px;height:30px;fill:none;stroke:#888780;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:stroke .25s}' +
      '.paco-plike.on svg{stroke:#0f6e56}.paco-plike:active i{transform:scale(1.2)}' +
      '.paco-plike span{font:bold 11px/1 Arial,sans-serif;color:#555;margin-top:2px;min-height:11px}.paco-plike.on span{color:#0f6e56}';
    document.head.appendChild(ps);
    var today = new Date().toISOString().slice(0, 10), PK = 'pacoPL:' + P, pon = false;
    try { pon = localStorage.getItem(PK) === today; } catch (e) {}
    var pb = document.createElement('button');
    pb.type = 'button'; pb.className = 'paco-plike' + (pon ? ' on' : ''); pb.setAttribute('aria-label', 'Thích trang này');
    pb.innerHTML = '<i><svg viewBox="0 0 24 24"><path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3a4 4 0 0 0 4-4V6a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1-2 2h-7a3 3 0 0 1-3-3"/></svg></i><span></span>';
    menu.insertBefore(pb, menu.firstChild);
    var pn = pb.querySelector('span'), pcount = 0; /* số thật, hiện từ 1 lượt trở lên */
    function pshow(n) { pcount = n || 0; pn.textContent = pcount > 0 ? pcount : ''; }
    window.addEventListener('load', function () { setTimeout(function () { getData().then(function (d) { pshow(d.plikes); }); }, 800); });
    pb.onclick = function () {
      if (pon) return; pon = true; pb.classList.add('on');
      pshow(pcount + 1);
      try { localStorage.setItem(PK, today); } catch (e) {}
      post({ a: 'plike', p: P }).then(function (r) { if (r && r.plikes) pshow(r.plikes); }).catch(function () {});
    };
  }

  /* Khung Thích/Bình luận: <div id="paco-lb"></div> (dùng số liệu của trang)
     hoặc nhiều khung trong 1 trang: <div class="paco-lb" data-p="/#ten-bai"></div> (mỗi bài số liệu riêng) */
  var boxes = document.querySelectorAll('#paco-lb,.paco-lb');
  var HB = (/^#bl-([\w-]+)$/.exec(location.hash) || [])[1];
  if (!boxes.length) return;

  var css = '.paco-lb{max-width:900px;margin:12px auto 24px;padding:4px 0 12px;box-sizing:border-box;font-size:16px}.paco-lb button{font-family:inherit}' +
    '.paco-lb .lb-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap;border-bottom:1px solid #eee;padding-bottom:6px}' +
    '.paco-lb .lb-like{display:inline-flex;align-items:center;gap:8px;border:1px solid #019570;color:#019570;background:#fff;border-radius:16px;padding:3px 12px;font-size:15px;line-height:1.4;cursor:pointer}' +
    '.paco-lb .lb-like.on{background:#019570;color:#fff}' +
    '.paco-lb .lb-count{font-size:16px;font-weight:bold;color:#333}.paco-lb .lb-fields{display:none}.paco-lb .lb-f.open .lb-fields{display:block}.paco-lb .lb-f{margin-top:8px}.paco-lb .lb-more{background:#fff;border:1px solid #019570;color:#019570;border-radius:8px;cursor:pointer;padding:3px 10px;font-size:13px;margin-right:8px;vertical-align:middle}.paco-lb .lb-send{vertical-align:middle}.paco-lb .lb-c.an{display:none}.paco-lb .lb-num{font-size:.85em;font-style:normal}.paco-lb .lb-num b{font-weight:normal}' +
    '.paco-lb .lb-c{border-bottom:1px solid #f0f0f0;padding:8px 0;font-size:16px}.paco-lb .lb-c small{font-size:13px}.paco-lb .lb-c b{color:#019570}.paco-lb .lb-c small{color:#999;margin-left:8px}' +
    '.paco-lb .lb-c p{margin:4px 0 0;white-space:pre-wrap;word-break:break-word}' +
    '.paco-lb .lb-empty{color:#999;margin:8px 0;font-size:15px}' +
    '.paco-lb h4{margin:20px 0 10px;font-size:17px;color:#333}' +
    '.paco-lb input,.paco-lb textarea{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:8px;padding:8px 10px;margin:0 0 8px;font:inherit;font-size:16px}' +
    '.paco-lb textarea{resize:none;overflow:hidden;min-height:40px;line-height:1.45;white-space:pre-wrap;word-break:break-word}' +
    '.paco-lb .lb-send{background:#019570;color:#fff;border:0;border-radius:8px;padding:4px 12px;cursor:pointer;font-size:14px;line-height:1.4}' +
    '.paco-lb .lb-msg{font-size:14px;margin-left:8px}.paco-lb .lb-msg.err{color:#d33}.paco-lb .lb-msg.ok{color:#019570}' +
    '.paco-lb .lb-hp{position:absolute;left:-9999px}' +
    '.paco-lb .lb-rep{margin:6px 0 0 18px;padding:6px 10px;border-left:3px solid #019570;background:#f3faf7;border-radius:4px;font-size:15px}.paco-lb .lb-rep b{color:#0f6e56}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function item(c, an) { return '<div class="lb-c' + (an ? ' an' : '') + '"' + (c.i ? ' id="bl-' + esc(c.i) + '"' : '') + '><b>' + esc(c.n) + '</b><small>' + esc(c.d) + '</small><p>' + esc(c.t) + '</p>' +
    (c.r ? '<div class="lb-rep"><b>PACOBOOKS trả lời</b><small>' + esc(c.rd) + '</small><p>' + esc(c.r) + '</p></div>' : '') + '</div>'; }
  [].forEach.call(boxes, setup);
  function setup(box) {
  box.classList.add('paco-lb');
  var K = box.getAttribute('data-p') || P;
  var KEY = 'pacoLike:' + K, liked = false, total = 0;
  try { liked = localStorage.getItem(KEY) === '1'; } catch (e) {}

  function render(d) {
    var cs = d.comments || []; total = cs.length + cs.filter(function (c) { return c.r; }).length; /* đếm cả câu trả lời */
    box.innerHTML =
      '<div class="lb-top"><button type="button" class="lb-like' + (liked ? ' on' : '') + '" aria-label="Thích bài viết">♥ <span>' + (d.likes || 0) + '</span> Thích</button>' +
      '<span class="lb-count">Bình luận <span class="lb-num">(<b>' + total + '</b>)</span></span></div>' +
      '<div class="lb-list">' + (cs.length ? cs.slice().reverse().map(function (c, i) { return item(c, i >= 3); }).join('') : '<p class="lb-empty">Hãy là người đầu tiên chia sẻ cảm nghĩ.</p>') + '</div>' +
      '<form class="lb-f" novalidate><div class="lb-fields">' +
      '<input name="n" maxlength="40" placeholder="Tên của bạn (bắt buộc)" autocomplete="name">' +
      '<textarea name="t" rows="1" maxlength="1000" placeholder="Cảm nghĩ của bạn..."></textarea></div>' +
      '<input name="hp" class="lb-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      (cs.length > 3 ? '<button type="button" class="lb-more">Xem thêm ' + (cs.length - 3) + ' bình luận</button>' : '') +
      '<button class="lb-send">Viết bình luận</button><span class="lb-msg"></span></form>';

    /* Bình luận hiện sẵn (3 mới nhất + "Xem thêm"); ô nhập ẩn, bấm "Viết bình luận" mới mở */
    var more = box.querySelector('.lb-more');
    if (more) more.onclick = function () { [].forEach.call(box.querySelectorAll('.lb-c.an'), function (x) { x.classList.remove('an'); }); more.remove(); };

    var b = box.querySelector('.lb-like');
    b.onclick = function () {
      if (liked) return; liked = true; b.classList.add('on');
      var s = b.querySelector('span'); s.textContent = (+s.textContent || 0) + 1;
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      post({ a: 'like', p: K }).then(function (r) { if (r && r.likes) s.textContent = r.likes; }).catch(function () {});
    };

    var f = box.querySelector('.lb-f'), m = box.querySelector('.lb-msg'), ta = f.t;
    function grow() { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; }
    ta.addEventListener('input', grow); window.addEventListener('resize', grow); grow();
    /* Mở ô nhập mà 5 giây chưa gõ gì thì tự thu lại */
    var hc;
    function dong() { f.classList.remove('open'); f.querySelector('.lb-send').textContent = 'Viết bình luận'; }
    function hen() { clearTimeout(hc); hc = setTimeout(function () { if (f.classList.contains('open') && !f.n.value.trim() && !ta.value.trim()) dong(); }, 5000); }
    f.n.addEventListener('input', hen); ta.addEventListener('input', hen);
    function msg(t, ok) { m.textContent = t; m.className = 'lb-msg ' + (ok ? 'ok' : 'err'); }

    f.onsubmit = function (ev) {
      ev.preventDefault();
      var btn = f.querySelector('.lb-send');
      if (!f.classList.contains('open')) { f.classList.add('open'); btn.textContent = 'Gửi bình luận'; m.textContent = ''; grow(); f.n.focus(); hen(); return; }
      var name = f.n.value.trim(), text = ta.value.trim();
      if (!name) { msg('Vui lòng nhập tên.'); f.n.focus(); return; }
      if (text.length < 2) { msg('Vui lòng nhập nội dung.'); ta.focus(); return; }
      btn.disabled = true; msg('Đang gửi...', true);
      post({ a: 'cmt', p: K, n: name, t: text, hp: f.hp.value }).then(function (r) {
        btn.disabled = false;
        if (!r || !r.ok) { msg('Chưa gửi được, bạn thử lại nhé.'); return; }
        msg('Cảm ơn bạn đã chia sẻ!', true);
        var list = box.querySelector('.lb-list'), em = list.querySelector('.lb-empty'); if (em) em.remove();
        list.insertAdjacentHTML('afterbegin', item({ i: r.id, n: name, t: text, d: r.d || '' }));
        box.querySelector('.lb-num b').textContent = ++total;
        ta.value = ''; dong();
      }).catch(function () { btn.disabled = false; msg('Chưa gửi được, bạn thử lại nhé.'); });
    };
  }

  function load() { getData(K).then(function (d) { render(d); toi(); }); }
  /* Link từ Telegram (...#bl-mã): mở sẵn và cuộn tới đúng bình luận đó */
  function toi() {
    var el = HB && box.querySelector('#bl-' + HB); if (!el) return;
    el.classList.remove('an'); el.style.background = '#e8f6f1'; el.style.transition = 'background 2s';
    var go = function () { el.scrollIntoView({ block: 'center' }); };
    go(); setTimeout(go, 800); setTimeout(function () { el.style.background = ''; }, 3000);
  }
  if (HB) { load(); }
  else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '600px' });
    io.observe(box);
  } else { load(); }
  }
})();
