# RIPARTENZA — 11/08/2026 (sera)

## Stato del sistema PB (PRODUZIONE, PWA v38 pushata)

**z 3,86 · +17.221 pip · 4.111 trade · win 53,51% · recente 3,01 · vecchio 2,43**

Comando canonico del motore di ricerca:
```
RAFFORZA=1 VUOTO=1 SOPRAF=1 VUOTOSTAG=wang DRENA=1 FLUSSOTI=1 NAYINDEB=1 SKIPCLASH=gm RISCATTO=b node pb_stress.js
```

Parità motore/PWA verificata: 0 disallineamenti su 4.111 tradate; 396/396 giorni di
clash giorno↔mese resi NO TRADE. Script: parita_check2.js.

## Adottato il 10-11/08/2026 (tutto in produzione, v36→v38)

1. **FLUSSOTI** — flusso del qi discreto sui tre rami del Bazi (capolinea = riceve e
   non cede): se il qi converge sul Ti, la sopraffazione non scatta.
2. **NAYINDEB** — Na Yin dell'esagramma iniziale (XKDG: esagramma→jiazi→Na Yin,
   mappa 64 verificata su 11 esagrammi noti): se rinfocola un Ti debole (死/囚) e il
   flusso non porta via, la sopraffazione non scatta.
3. **SKIPCLASH=gm** — NO TRADE quando il ramo del giorno clasha il ramo del mese
   (rompe la cornice stagionale). Clash validi: solo perno sul giorno (g↔m, g↔a,
   stelo g↔m via Cinque Tigri). Badge PWA: "CLASH GIORNO↔MESE · no trade".
4. **RISCATTO=b** — base 我生 non-segue, ramo dell'ora del palazzo del Yong prospero
   del mese che controlla il trasformato, Na Yin = Ti → torna segue. ⚠️ Regola da
   4 casi in 6 anni: adottata sulla dottrina, la giudica il forward test.

## Scartati con i numeri il 10-11/08 (non riaprire senza dati nuovi)

- Modello di forza continuo (3 modi + sweep): sempre negativo; la forza modula per
  condizioni discrete, non per punteggi.
- Clash fra tombe 辰戌/丑未 aperte (4 forme): peggiora sempre (fino a −0,21 z).
- PONTEDRENA e DRENADOPPIO: effetto concentrato nella carta di origine (+722 su
  +1.003), 14/14 sulle altre.
- Astensione su clash giorno↔anno: quel gruppo è il MIGLIORE del sistema
  (54,95%; tombe col Tai Sui 59,05%, 15,1 pip/carta) — filone positivo aperto.
- Atterraggio della mutante nel vuoto come regola PB (3 forme).
- Unificazione dei selettori a ora (pareggio −0,28, tutto −0,35): l'assetto misto è
  giusto — ora dove parla la data (clash palazzo, riscatto), linea dove parla
  l'esagramma (pareggio, vuoto).
- Veto anti-Long LY sul PB (3 gradazioni): i LONG vetati erano vincitori.

## LIU YAO — linea aperta (vedi REGISTRO_LIUYAO_11_08_2026.md per il dettaglio)

Infrastruttura completa nel motore: palazzi Jing Fang (Shi/Ying), Na Jia, parenti,
dottrina della mutante di Edu (4 casi + 動不為空 + arrivo vuoto nullo + sospensione
da combinazione/clash col giorno + combinazione/clash dell'arrivo con Shi/Ying +
forza mese+giorno). Attivazione: LIUTAG=1, referti LIUREP=1 e LYSPACCATO=1, spacco
periodi LFROM/LTO.

**Risultato chiave — cella amplificatore**: giorni "Brother sostenuto + trend su"
(Shi=Brother valido, Ying valido e forte che lo genera, EMA su): 126 carte, il PB
dentro la cella vince ~63,5% (media sistema 53,5%). REGGE sui due periodi
(recente 64,6%, vecchio 61,7%). Il LY certifica il PB, non lo corregge.

## Piano prossima sessione

1. **Celle sorelle LY**: Wealth/Officer/Children/Parents al Soggetto con la stessa
   dottrina completa; Shi forte vs debole. Cercare altri amplificatori (e eventuali
   celle di sconfidenza), sempre col PB al comando.
2. **Se il quadro regge**: disegnare l'etichetta di confidenza in PWA (segnale di
   prima scelta nei giorni-cella) e/o sizing differenziato.
3. **Affinamento LY**: forza completa linea per linea, tombe delle linee, 伏神,
   Sei Bestie; chiarire con Edu il caso stesso-elemento della mutante (trattato
   come "partenza rafforzata").
4. **Filone tombe col Tai Sui** (59%, 15 pip/carta) come segnale positivo — mai
   esplorato, resta in coda.
5. Soglia autoimposta z>4 (corretta per correlazione cross ~2,5 e ~300 test totali).

## File del pacchetto

- pb_stress.js (motore completo: PB canonico + Liu Yao + tutti i test documentati)
- REGISTRO_LIUYAO_11_08_2026.md
- parita_check2.js, nayin_map.json
- work_trading/pwa/ (plumblossom.js, app.js, sw.js = v38 in produzione)
- full1h.json, package.json, catena_v24.js, SISTEMA_CATENE_v3.md (DLR fermo a −2.565)

## Promemoria operativi

- Deploy PWA: GitHub Desktop → push; Cloudflare per il Worker (EMA 12 + emaRun).
- Marzo 2020 (Covid) escluso dalla palestra come anomalo.
- Terminologia: "segue/non segue il trend" (mai "inverte"), "steli" (mai "tronchi"),
  date DD/MM/YYYY.
- Holdout PB mai aperto (Jun 2024→). NB: la palestra corrente usa full1h fino a
  oggi — per la prossima grande validazione considerare lo stato dell'holdout.
