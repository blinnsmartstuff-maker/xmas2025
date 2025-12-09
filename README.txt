OPERATION: SAVE CHRISTMAS — FULL CODE PACKAGE

FILES
-----
mission0.html
  Opening cinematic transmission with elf audio, tap-to-start overlay,
  snowfall, and "TRANSMISSION ENDED" blackout.

transmission-style.css
  Styles shared by mission0.html. Tuned for TVs (Fire Stick / Silk).

snow.js
  Lightweight snowfall animation used by mission0.html.

operation_save_christmas.html
  Mission Control tracker with 4 stages:
    1. Algorithm Restored
    2. Rogue Elf Apprehended
    3. Flight Path Restored
    4. Santa Cleared for Takeoff
  - Candy cane icons fill in as stages complete.
  - Background color changes per stage.
  - Live countdown to midnight in America/Chicago time zone.

operation.css
  Visual styles for the Mission Control tracker page.

candycane_empty.svg / candycane_full.svg
  Icons used for incomplete / complete steps.

USAGE
-----
1) HOSTING
   Upload all files to the same directory on your web host
   (GitHub Pages / Netlify / simple web server).

2) FIRE TV - OPENING CINEMATIC
   Use mission0.html as the opening briefing.
   In your Alexa routine for the start of the party, open:
     https://YOUR-HOST/mission0.html

3) FIRE TV - MISSION CONTROL TRACKER
   For each physical button (Mission 1–4), configure an Alexa routine
   to open one of the following URLs on the Fire TV:

   Stage 1:
     https://YOUR-HOST/operation_save_christmas.html?stage=1

   Stage 2:
     https://YOUR-HOST/operation_save_christmas.html?stage=2

   Stage 3:
     https://YOUR-HOST/operation_save_christmas.html?stage=3

   Stage 4:
     https://YOUR-HOST/operation_save_christmas.html?stage=4

   The tracker will fill in all stages <= N and change the background.
   The live countdown will always show time remaining to midnight
   in the Central (America/Chicago) time zone.

4) AUDIO
   mission0.html currently expects an MP3 named:
     speech_20251111195406392.mp3
   Place your actual recording with that name alongside mission0.html
   OR adjust the <audio src="..."> tag to your filename.

NOTES
-----
- All HTML files include no-cache headers to avoid stale content
  on Fire TV / Silk.
- For best results, hide the Silk browser UI and calibrate TV display
  so the page fills the screen.
