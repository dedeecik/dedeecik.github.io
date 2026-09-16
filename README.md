# getgamebuddy.com

Game Buddy'nin tanıtım, destek ve gizlilik sitesi. GitHub Pages'te yayınlanıyor.

| Yol | İçerik |
|---|---|
| `/` , `/en/` | Ana sayfa |
| `/gizlilik/` , `/privacy/` | Gizlilik politikası |
| `/destek/` , `/support/` | Destek ve sık sorulan sorular |
| `/app-ads.txt` | AdMob yetkili satıcı doğrulaması — **kök dizinde kalmalı** |

## Güncelleme

Gizlilik politikası elle yazılmıyor; uygulama deposundaki
`lib/sozlesmeler.dart` dosyasından üretiliyor. Politika değişince:

```
node uret.js
```

Uygulama deposu bu klasörün yanında (`../game_buddy`) değilse:

```
UYGULAMA=/yol/game_buddy node uret.js
```
