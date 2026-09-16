// getgamebuddy.com sitesini üretir.
//
// Gizlilik politikası elle kopyalanmıyor: metin doğrudan uygulamanın
// lib/sozlesmeler.dart dosyasından okunuyor. Politika değişince:
//
//   node uret.js
//
// çalıştırıp commit'lemek yeterli. Böylece uygulamadaki metinle sitedeki
// metin birbirinden kopamıyor.
//
// Uygulama deposunun bu klasörün yanında (../game_buddy) olduğu
// varsayılıyor; başka yerdeyse UYGULAMA ortam değişkeniyle verilir.

const fs = require('fs');
const path = require('path');

const KOK = __dirname;
const UYGULAMA = process.env.UYGULAMA || path.join(KOK, '..', 'game_buddy');
const SOZLESMELER = path.join(UYGULAMA, 'lib', 'sozlesmeler.dart');

// --- Dart kaynağından metinleri çek ----------------------------------

const dart = fs.readFileSync(SOZLESMELER, 'utf8');

function sabitMetin(ad) {
  const m = dart.match(new RegExp(`const String ${ad} = '''\\n([\\s\\S]*?)''';`));
  if (!m) throw new Error(`${ad} sozlesmeler.dart icinde bulunamadi`);
  return m[1];
}

const eposta = (dart.match(/const String iletisimEposta = '([^']+)';/) || [])[1];
if (!eposta) throw new Error('iletisimEposta bulunamadi');

const yerlestir = (t) => t.replace(/\$iletisimEposta/g, eposta);
const politikaTr = yerlestir(sabitMetin('gizlilikPolitikasi'));
const politikaEn = yerlestir(sabitMetin('gizlilikPolitikasiEn'));

// --- Düz metinden HTML ------------------------------------------------

const kacir = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function baglantila(s) {
  return s
    .replace(/https:\/\/[^\s<]+/g, (u) => `<a href="${u}" rel="noopener">${u}</a>`)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (e) => `<a href="mailto:${e}">${e}</a>`);
}

/** Politika metnini başlıklar, listeler ve paragraflara ayırır. */
function politikaHtml(metin) {
  const satirlar = metin.trim().split(/\r?\n/);
  const guncelleme = satirlar.shift();
  const basliklar = [];
  let govde = '';
  let liste = [];

  const listeyiKapat = () => {
    if (!liste.length) return;
    govde += '<ul>' + liste.map((l) => `<li>${l}</li>`).join('') + '</ul>\n';
    liste = [];
  };

  for (const ham of satirlar) {
    const satir = ham.trim();
    if (!satir) { listeyiKapat(); continue; }

    const baslik = satir.match(/^(\d+)\. (.+)$/);
    if (baslik) {
      listeyiKapat();
      const id = `b${baslik[1]}`;
      basliklar.push({ id, no: baslik[1], ad: baslik[2] });
      govde += `<h2 id="${id}"><span class="no">${baslik[1]}</span>${kacir(baslik[2])}</h2>\n`;
      continue;
    }
    if (satir.startsWith('- ')) {
      liste.push(baglantila(kacir(satir.slice(2))));
      continue;
    }
    listeyiKapat();
    govde += `<p>${baglantila(kacir(satir))}</p>\n`;
  }
  listeyiKapat();

  const icindekiler =
    '<nav class="icindekiler"><ol>' +
    basliklar.map((b) => `<li><a href="#${b.id}">${kacir(b.ad)}</a></li>`).join('') +
    '</ol></nav>';

  return { guncelleme: kacir(guncelleme), icindekiler, govde };
}

// --- Sayfa iskeleti ---------------------------------------------------

const CSS = `
:root {
  --zemin: #F4EFEF; --yuzey: #FFFFFF; --murekkep: #2A2124;
  --ikincil: #6B5B60; --sonuk: #8C7A7E; --cizgi: #E6DADC;
  --gul: #B9737F; --gul-koyu: #9E6480; --odak: #B9737F;
}
@media (prefers-color-scheme: dark) {
  :root {
    --zemin: #17131A; --yuzey: #221C25; --murekkep: #F2EBED;
    --ikincil: #B6A6AC; --sonuk: #8C7C82; --cizgi: #342B37;
    --gul: #D98A98; --gul-koyu: #C4798F; --odak: #D98A98;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--zemin); color: var(--murekkep);
  font: 17px/1.65 "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--gul); text-underline-offset: 3px; }
a:focus-visible { outline: 2px solid var(--odak); outline-offset: 3px; border-radius: 4px; }
.sayfa { max-width: 720px; margin: 0 auto; padding: 0 22px 72px; }
header.ust {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 0 10px; gap: 16px;
}
.marka {
  font-weight: 700; font-size: 19px; letter-spacing: -.01em;
  color: var(--murekkep); text-decoration: none;
}
.marka b { color: var(--gul); font-weight: 700; }
.dil { font-size: 14px; color: var(--sonuk); text-decoration: none; }
.dil:hover { color: var(--gul); }
h1 {
  font-size: clamp(30px, 6vw, 40px); line-height: 1.12; letter-spacing: -.025em;
  margin: 34px 0 8px; text-wrap: balance;
}
.guncelleme { color: var(--sonuk); font-size: 14.5px; margin: 0 0 26px; }
h2 {
  font-size: 21px; line-height: 1.3; letter-spacing: -.01em;
  margin: 44px 0 10px; scroll-margin-top: 20px; display: flex; gap: 8px; align-items: baseline;
}
h2 .no { color: var(--gul); font-variant-numeric: tabular-nums; min-width: 1.3em; }
p, li { color: var(--ikincil); max-width: 66ch; }
p { margin: 0 0 14px; }
ul { margin: 0 0 16px; padding-left: 22px; }
li { margin-bottom: 7px; }
li::marker { color: var(--gul); }
.icindekiler {
  background: var(--yuzey); border: 1px solid var(--cizgi); border-radius: 18px;
  padding: 18px 22px; margin-bottom: 8px;
}
.icindekiler ol { margin: 0; padding-left: 22px; columns: 2; column-gap: 28px; }
.icindekiler li { margin: 0 0 6px; break-inside: avoid; font-size: 15px; }
.icindekiler li::marker { color: var(--sonuk); font-variant-numeric: tabular-nums; }
.icindekiler a { color: var(--murekkep); text-decoration: none; }
.icindekiler a:hover { color: var(--gul); }
@media (max-width: 560px) { .icindekiler ol { columns: 1; } }
footer {
  margin-top: 64px; padding-top: 22px; border-top: 1px solid var(--cizgi);
  display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 14px; color: var(--sonuk);
}
footer a { color: var(--sonuk); text-decoration: none; }
footer a:hover { color: var(--gul); }

/* Ana sayfa */
.kahraman { padding: 64px 0 20px; }
.amblem {
  width: 72px; height: 72px; border-radius: 22px;
  background: linear-gradient(135deg, var(--gul), var(--gul-koyu));
  display: grid; place-items: center; margin-bottom: 26px;
  box-shadow: 0 14px 30px -12px var(--gul);
}
.amblem svg { width: 40px; height: 40px; fill: #FFF7F8; }
.kahraman h1 { font-size: clamp(40px, 9vw, 58px); margin: 0 0 10px; }
.slogan { font-size: 21px; color: var(--ikincil); margin: 0 0 18px; }
.aciklama { font-size: 17px; max-width: 46ch; }
.yakinda {
  display: inline-block; margin-top: 10px; padding: 7px 14px; border-radius: 999px;
  background: color-mix(in srgb, var(--gul) 14%, transparent);
  color: var(--gul); font-weight: 600; font-size: 14.5px;
}
.kartlar { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 48px; }
.kart {
  display: block; background: var(--yuzey); border: 1px solid var(--cizgi); border-radius: 18px;
  padding: 20px 22px; text-decoration: none; color: var(--murekkep);
  transition: border-color .15s ease, transform .15s ease;
}
.kart:hover { border-color: var(--gul); transform: translateY(-2px); }
.kart strong { display: block; font-size: 17px; margin-bottom: 4px; }
.kart span { color: var(--sonuk); font-size: 14.5px; }

/* Destek */
.iletisim {
  background: var(--yuzey); border: 1px solid var(--cizgi); border-radius: 18px;
  padding: 22px 24px; margin: 8px 0 12px;
}
.iletisim .etiket { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--sonuk); margin: 0 0 4px; }
.iletisim a { font-size: 21px; font-weight: 700; text-decoration: none; }
.iletisim p:last-child { margin: 8px 0 0; font-size: 15px; }
details {
  background: var(--yuzey); border: 1px solid var(--cizgi); border-radius: 16px;
  padding: 0 20px; margin-bottom: 10px;
}
summary {
  cursor: pointer; font-weight: 600; padding: 16px 0; list-style: none;
  display: flex; justify-content: space-between; gap: 16px;
}
summary::-webkit-details-marker { display: none; }
summary::after { content: "+"; color: var(--gul); font-weight: 400; font-size: 22px; line-height: 1; }
details[open] summary::after { content: "−"; }
details > div { padding-bottom: 6px; }
kbd {
  font: inherit; font-size: .92em; background: var(--zemin); border: 1px solid var(--cizgi);
  border-radius: 6px; padding: 1px 6px; color: var(--murekkep); white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

// Material "sports_esports" ikonu — uygulamadaki amblemle aynı.
const OYUN_KOLU =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>';

function sayfa({ dil, baslik, aciklama, derinlik, digerDil, icerik }) {
  const kok = derinlik ? '../' : './';
  const tr = dil === 'tr';
  const ana = tr ? kok : `${kok}en/`;
  const alt = tr
    ? `<a href="${kok}gizlilik/">Gizlilik Politikası</a><a href="${kok}destek/">Destek</a><a href="mailto:${eposta}">${eposta}</a>`
    : `<a href="${kok}privacy/">Privacy Policy</a><a href="${kok}support/">Support</a><a href="mailto:${eposta}">${eposta}</a>`;

  return `<!doctype html>
<html lang="${dil}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${baslik}</title>
<meta name="description" content="${aciklama}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap">
<style>${CSS}</style>
</head>
<body>
<div class="sayfa">
<header class="ust">
  <a class="marka" href="${ana}">Game <b>Buddy</b></a>
  <a class="dil" href="${digerDil}" hreflang="${tr ? 'en' : 'tr'}">${tr ? 'English' : 'Türkçe'}</a>
</header>
<main>
${icerik}
</main>
<footer>${alt}<span>© 2026 Game Buddy</span></footer>
</div>
</body>
</html>
`;
}

// --- Sayfalar ---------------------------------------------------------

function yaz(goreli, html) {
  const hedef = path.join(KOK, goreli);
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.writeFileSync(hedef, html);
  console.log('  ' + goreli);
}

console.log('Kaynak: ' + SOZLESMELER);
console.log('E-posta: ' + eposta);

// Ana sayfa
yaz('index.html', sayfa({
  dil: 'tr', derinlik: 0, digerDil: './en/',
  baslik: 'Game Buddy — Oyun arkadaşını bul',
  aciklama: 'Aynı oyunu oynayan ve şu an müsait olan oyuncularla eşleş.',
  icerik: `
<section class="kahraman">
  <div class="amblem">${OYUN_KOLU}</div>
  <h1>Game Buddy</h1>
  <p class="slogan">Oyun arkadaşını bul.</p>
  <p class="aciklama">Aynı oyunu oynayan, aynı rank aralığında ve şu an müsait olan oyuncularla eşleş. Kaydır, davet et, birlikte oyna.</p>
  <span class="yakinda">Yakında App Store'da</span>
  <div class="kartlar">
    <a class="kart" href="./destek/"><strong>Destek</strong><span>Sık sorulan sorular ve iletişim</span></a>
    <a class="kart" href="./gizlilik/"><strong>Gizlilik Politikası</strong><span>Hangi verileri neden işliyoruz</span></a>
  </div>
</section>`,
}));

yaz('en/index.html', sayfa({
  dil: 'en', derinlik: 1, digerDil: '../',
  baslik: 'Game Buddy — Find your gaming partner',
  aciklama: 'Match with players who play the same game and are available right now.',
  icerik: `
<section class="kahraman">
  <div class="amblem">${OYUN_KOLU}</div>
  <h1>Game Buddy</h1>
  <p class="slogan">Find your gaming partner.</p>
  <p class="aciklama">Match with players who play the same game, sit in the same rank range and are available right now. Swipe, invite, play together.</p>
  <span class="yakinda">Coming soon to the App Store</span>
  <div class="kartlar">
    <a class="kart" href="../support/"><strong>Support</strong><span>FAQ and contact</span></a>
    <a class="kart" href="../privacy/"><strong>Privacy Policy</strong><span>What data we process and why</span></a>
  </div>
</section>`,
}));

// Gizlilik
for (const [dil, metin, yol, diger, baslik] of [
  ['tr', politikaTr, 'gizlilik/index.html', '../privacy/', 'Gizlilik Politikası'],
  ['en', politikaEn, 'privacy/index.html', '../gizlilik/', 'Privacy Policy'],
]) {
  const p = politikaHtml(metin);
  yaz(yol, sayfa({
    dil, derinlik: 1, digerDil: diger,
    baslik: `${baslik} — Game Buddy`,
    aciklama: dil === 'tr' ? 'Game Buddy gizlilik politikası' : 'Game Buddy privacy policy',
    icerik: `<h1>${baslik}</h1>\n<p class="guncelleme">${p.guncelleme}</p>\n${p.govde.replace('<h2 ', p.icindekiler + '\n<h2 ')}`,
  }));
}

// Destek
const sss = {
  tr: [
    ['Hesabımı nasıl silerim?',
      `<p>Uygulamada <kbd>Profilim</kbd> → <kbd>Ayarlar</kbd> → <kbd>Hesabımı sil</kbd>. Profilin, eşleşmelerin ve mesajların kalıcı olarak silinir.</p>
       <p>Uygulamaya giremiyorsan, hesabında kayıtlı e-posta adresinden <a href="mailto:${eposta}">${eposta}</a> adresine yaz; talebini 30 gün içinde yerine getiririz.</p>`],
    ['Premium aboneliğimi nasıl iptal ederim?',
      `<p>Abonelikler Apple üzerinden yönetilir. iPhone'da <kbd>Ayarlar</kbd> → adın → <kbd>Abonelikler</kbd> → <kbd>Game Buddy</kbd> → <kbd>Aboneliği İptal Et</kbd>.</p>
       <p>Uygulamadan da ulaşabilirsin: <kbd>Profilim</kbd> → <kbd>Ayarlar</kbd> → <kbd>Aboneliğimi yönet</kbd>.</p>
       <p><strong>Hesabını silmek aboneliği iptal etmez.</strong> Önce aboneliği iptal et.</p>`],
    ['Şifremi unuttum.',
      `<p>Giriş ekranında <kbd>E-posta ile devam et</kbd> → <kbd>Şifremi unuttum</kbd>. Sıfırlama bağlantısı e-posta adresine gelir; birkaç dakika içinde gelmezse gereksiz klasörüne bak.</p>`],
    ['Bir kullanıcıyı nasıl şikâyet eder ya da engellerim?',
      `<p>Kullanıcının profilini aç, sağ üstteki menüden <kbd>Şikayet et</kbd> ya da <kbd>Engelle</kbd>. Engellediğin kişi seni bir daha göremez ve sana yazamaz. Engellediklerini <kbd>Ayarlar</kbd> → <kbd>Engellediklerim</kbd> altından yönetebilirsin.</p>`],
    ['Reklam izinlerimi nasıl değiştiririm?',
      `<p><strong>iPhone izleme izni:</strong> iPhone'da <kbd>Ayarlar</kbd> → <kbd>Gizlilik ve Güvenlik</kbd> → <kbd>İzleme</kbd>.</p>
       <p><strong>Avrupa'daysan:</strong> uygulamada <kbd>Profilim</kbd> → <kbd>Ayarlar</kbd> → <kbd>Reklam izinleri</kbd>.</p>
       <p>Premium üyeler reklam görmez.</p>`],
  ],
  en: [
    ['How do I delete my account?',
      `<p>In the app, go to <kbd>My profile</kbd> → <kbd>Settings</kbd> → <kbd>Delete my account</kbd>. Your profile, matches and messages are permanently deleted.</p>
       <p>If you can't access the app, write to <a href="mailto:${eposta}">${eposta}</a> from the email address on your account; we complete requests within 30 days.</p>`],
    ['How do I cancel my Premium subscription?',
      `<p>Subscriptions are managed by Apple. On your iPhone go to <kbd>Settings</kbd> → your name → <kbd>Subscriptions</kbd> → <kbd>Game Buddy</kbd> → <kbd>Cancel Subscription</kbd>.</p>
       <p>You can also get there from the app: <kbd>My profile</kbd> → <kbd>Settings</kbd> → <kbd>Manage my subscription</kbd>.</p>
       <p><strong>Deleting your account does not cancel your subscription.</strong> Cancel the subscription first.</p>`],
    ['I forgot my password.',
      `<p>On the sign-in screen, tap <kbd>Continue with email</kbd> → <kbd>Forgot my password</kbd>. A reset link is sent to your email; if it doesn't arrive within a few minutes, check your spam folder.</p>`],
    ['How do I report or block a user?',
      `<p>Open the user's profile and use the menu in the top right: <kbd>Report</kbd> or <kbd>Block</kbd>. People you block can no longer see you or message you. Manage them under <kbd>Settings</kbd> → <kbd>Blocked users</kbd>.</p>`],
    ['How do I change my ad permissions?',
      `<p><strong>iPhone tracking permission:</strong> on your iPhone go to <kbd>Settings</kbd> → <kbd>Privacy &amp; Security</kbd> → <kbd>Tracking</kbd>.</p>
       <p><strong>If you're in Europe:</strong> in the app go to <kbd>My profile</kbd> → <kbd>Settings</kbd> → <kbd>Ad permissions</kbd>.</p>
       <p>Premium members don't see ads.</p>`],
  ],
};

for (const [dil, yol, diger] of [['tr', 'destek/index.html', '../support/'], ['en', 'support/index.html', '../destek/']]) {
  const tr = dil === 'tr';
  const sorular = sss[dil].map(([s, c]) => `<details><summary>${s}</summary><div>${c}</div></details>`).join('\n');
  yaz(yol, sayfa({
    dil, derinlik: 1, digerDil: diger,
    baslik: tr ? 'Destek — Game Buddy' : 'Support — Game Buddy',
    aciklama: tr ? 'Game Buddy destek ve sık sorulan sorular' : 'Game Buddy support and FAQ',
    icerik: `
<h1>${tr ? 'Destek' : 'Support'}</h1>
<div class="iletisim">
  <p class="etiket">${tr ? 'Bize yaz' : 'Write to us'}</p>
  <a href="mailto:${eposta}">${eposta}</a>
  <p>${tr ? 'Genellikle birkaç iş günü içinde yanıt veriyoruz. Hesapla ilgili taleplerde, hesabında kayıtlı e-posta adresinden yazarsan daha hızlı yardımcı olabiliriz.' : 'We usually reply within a few business days. For account requests, writing from the email address on your account helps us help you faster.'}</p>
</div>
<h2>${tr ? 'Sık sorulan sorular' : 'Frequently asked questions'}</h2>
${sorular}`,
  }));
}

console.log('Tamam.');
