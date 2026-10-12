# stylishnineperf guild boss charts (read 2026-10-12)

Source: YouTube channel @stylishnineperf (channel id UCM3xcY_APOZjr3zYNxeoSrQ).
Each run links a public Google Sheet with a turn chart and the result screen.
YouTube blocks video downloads from cloud sessions; the channel RSS feed
(`/feeds/videos.xml?channel_id=...`) carries the descriptions and sheet links.

## Result screens (Nightmare)

| Run | Base | Weakened | Boss | x | Total |
|---|---|---|---|---|---|
| Surt DOD, 2026-10-09 | 445,010 | 3,959,601,152 | 250,000 | 4 | 15,841,184,648 |
| Slaughter Drive DOD, A6 Kotone, 2026-09-25 | 827,135 | 2,891,896,832 | 250,000 | 4 | 11,571,895,868 (rank 1) |
| Slaughter Drive DOD, no-Cohesion variant | 827,135 | 2,731,492,864 | 250,000 | 4 | 10,930,279,996 |

Surt DOD pre-break linked HP is therefore 445,010 in total (now in `src/data.js`).

## Chart notation

- パペ = Wavecatcher Miyu (swimsuit Puppet). 解除 = leave Surf; S3 = enter Surf.
  解除 in the HL column before Miyu's turn = switch the HP lock off.
- ハム子 = Kotone. 全力 = Go for Broke; "全力 S3 JC" = Go for Broke, then Lunar
  Phaseshift naming J&C; 再1-再4 = Fortune actions; 風邪 = Cold.
- MIKU songs: H = Heaven, 春 = Spring Storm, ヒ = Play-With-Fire.
- 優越JC = J&C (Strategist). 特殊 = True Desire enhanced skill. "S2 (+S3)" = S2
  plus the automatic Two Masks nuke.
- 万象 = Universal Theoria, 凝結 = Cohesion, タル = Tarukaja, マハタル =
  Matarukaja, リベ = Rebellion, 音波 = Sonic Interference, サメ固有 =
  Sahimochi-no-kami signature, ラクンダ = Rakunda.
- Every Wonder ally buff in these charts targets the carry (パペ or YUI).
- 行動数 = a running action counter (9 per round on Slaughter Drive: 4 party
  plus 5 enemies), "ライブ" = Virtual Concert round.
- Header notes give the carry's Pierce "needed, including the navigator
  share" (for example Miyu 35.9% on Surt MLD, Cosmic Yui 27.0% on Yatsufusa
  MLD), which suggests building up to a Pierce cap.

## The user's 11.5b Slaughter Drive DOD rotation

It is this channel's A6 Kotone chart (sheet 1Ucc47UNlZ...). Live, the user's
own run gained only 57m points in B4 against 283m simulated; in the simulator
J&C alone makes 28m there. The break window most likely closes when the boss
takes its second Weakened turn partway through B4, after J&C acts, while the
engine lets the whole round score. Unconfirmed; it needs the boss's turn
position.

## Sheets

| Video | Sheet id |
|---|---|
| Surt DOD 15.84b (Nkd5QPTm1VE) | 1aBhmxZtdO2xwcmNyc3Odv31fRTF0nWeECWRceFPlFBE |
| Yatsufusa MLD 8.74b (npcIe24LntQ) | 1W9tHwoDMnJdhAuT43qHibu7nBeArEgGUEPMVys62hjI |
| Slaughter Drive MLD (o0scpdzQ5uo) | 1Gz--2Da14kQtyZvka_Rj7lWz5XCc1H8BpvGzLu9l61U |
| Baal Zebul DOD 10.28b (5pwDX3FXmLA) | 1eNsKdvph8cSMyR35hhQOLqRiTcOiuNjDJBpfDYYac1E |
| Slaughter Drive DOD A6 Kotone 11.57b (L6ufZOSWx0I) | 1Ucc47UNlZnfyhWBzRWfWwM2u_UHfYOgqlU9q9Xv1QpI |
| Surt MLD wind and Marian (QM-zIbhWVyM) | 1SOkoFAJy7adDXYcjyIhK7KKM-6Z0zQZrTgTWan1N6xM |
| Yatsufusa MLD wind and Marian (iLO-E_kUvqU) | 1gT0Tktw3aVgfjd_Ine_13fUnYtO0rradxDowsEByEbA |
| Yatsufusa DOD (EvfuY3HCpGk) | 1DRDDa6ClGGyruBgHwS2jAci28e0t6gP_ElBRR_1lE2k |
| Yatsufusa DOD (NcipxtTxP9E) | 1gtWhWly0ERiU3cGUl-IpANfIm4kf1lC_bAEFfF3JXyU |
| Hachiman MLD wind and Marian (N4KSYHP9xU0) | 16BhwUzykIlXzE1P8f5m0bwcy9GigJA50rVQtOLFEPjk |
| Slaughter Drive DOD wind (pNdXrgW2TeE) | 1fqAjBc9hyMyE96oqJnjfjfmywasER8Da4N1yip0dmCI |
| Hachiman NOD wind (ki_I_KMngec) | 15cK5D6pO8iEZOOZvBxwEa9Gwz_jEOZadsQrfBAsRx1Q |
