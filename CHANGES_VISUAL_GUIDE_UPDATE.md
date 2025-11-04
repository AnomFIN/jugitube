# AnomTube - Päivityksen visuaalinen opas

## Tehdyt muutokset

### 1. Lyriikka-konsolin leveys kasvatettu
- **Aiemmin**: Konsolin minimileveysasetuksena oli 300px, mikä teki paneelista liian leveän pienemmille näytöille
- **Nyt**: Minimileveysasetus on 220px, mikä mahdollistaa paremman responsiivisuuden ja näkyvyyden eri kokoisilla näytöillä
- **Testaus**: Avaa YouTube-video ja aktivoi AnomTube. Lyriikka-konsolin tulisi näkyä oikeassa alakulmassa ja olla sopivan leveä.

### 2. Uusi asetus: Piilota lyriikka-popup kokonaan
- **Sijainti**: Popup → Lisäasetukset → "Piilota lyriikka-popup"
- **Toiminnallisuus**: Kun tämä asetus on päällä, lyriikka-karaoke-konsoliikkuna ei näy lainkaan
- **Testaus**: 
  1. Avaa AnomTube popup
  2. Ota "Piilota lyriikka-popup" käyttöön
  3. Mene YouTube-videolle
  4. Varmista että lyriikka-ikkuna ei ilmesty

### 3. Parannettu mainosklikin toiminto
- **Uusi toteutus**: Käyttää MutationObserveria DOM-muutosten tarkkailuun
- **Parannetut ominaisuudet**:
  - Automaattinen "Ohita mainos" -napin tunnistus ja klikkaus
  - Rate-limiting: Maksimissaan 3 yritystä minuutissa per nappi
  - Useampia nappi-selektoreita tuettu
  - Parempi false-positive -suojaus
- **Testaus**:
  1. Aktivoi "Mainokset ASAP POIS" asetus
  2. Toista YouTube-videota jossa on mainoksia
  3. Tarkkaile että "Ohita" -nappi klikataan automaattisesti kun se ilmestyy

### 4. Uusi asetus: Salli video + mainosten hallinta
- **Sijainti**: Popup → Lisäasetukset → "Salli video + mainosten hallinta"
- **Toiminnallisuus**: 
  - Kun päällä: Video näkyy normaalisti, mutta mainosasetukset toimivat
  - Kun pois päältä (oletus): Video piilotetaan ja näytetään audio-only -placeholder
- **Testaus**:
  1. Avaa AnomTube popup
  2. Ota "Salli video + mainosten hallinta" käyttöön
  3. Mene YouTube-videolle
  4. Varmista että video näkyy mutta mainokset hallitaan asetuksien mukaan

## Tekninen yhteenveto

### Muokatut tiedostot:
1. **content.css**
   - Lisätty `.anomfin-lyrics--hidden` -luokka
   - Päivitetty `.anomfin-lyrics__panel` min-width 220px:ksi

2. **popup.html**
   - Lisätty uusi "Lisäasetukset" -osio
   - Lisätty kaksi uutta toggle-vaihtoehtoa

3. **popup.js**
   - Lisätty `hideLyricsToggle` ja `allowVideoToggle` elementtien käsittely
   - Päivitetty `loadState()` lataamaan uudet asetukset
   - Lisätty `handleSettingChange()` funktio

4. **content.js**
   - Lisätty `hideLyrics` ja `allowVideo` tilan hallinta
   - Lisätty `updateSettings()` metodi
   - Toteutettu `startAdSkipperObserver()` ja `stopAdSkipperObserver()`
   - Parannettu `trySkipAd()` metodia rate-limitingillä
   - Lisätty `tryClickAdButton()` ja `getButtonIdentifier()` apumetodit

5. **background.js**
   - Lisätty `hideLyrics` ja `allowVideo` oletusarvoihin

## Yhteensopivuus
- Kaikki vanhat asetukset säilyvät ja toimivat ennallaan
- Uudet asetukset oletusarvoisesti pois päältä (false)
- Ei rikkovia muutoksia olemassa olevaan toiminnallisuuteen
