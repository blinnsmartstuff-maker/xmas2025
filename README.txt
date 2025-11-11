
OPERATION: SAVE CHRISTMAS — Mission Screens (Fire TV / Alexa)

FILES
-----
mission0.html  – Opening Transmission (System Compromised)
mission1.html  – Level 1 Complete (Algorithm Restored)
mission2.html  – Level 2 Complete (Rogue Elf Apprehended)
mission3.html  – Level 3 Complete (Flight Path Restored)
mission4.html  – Final Launch (Santa Cleared for Takeoff)
transmission-style.css – Shared visual theme (red/silver, glow, snowfall)
transmission-beep.wav  – Short static/beep sound (auto-plays on load)
snow.js – Lightweight snowfall animation
 
HOSTING ON GOOGLE DRIVE
-----------------------
1) Upload ALL files to the same folder in Google Drive.
2) Right-click each HTML file -> Get link -> Anyone with the link (Viewer).
3) Copy the file ID (the long string between /d/ and /view in the share URL).
4) Build the viewable link with:
   https://drive.google.com/uc?export=view&id=FILE_ID
5) Test each link on the Fire Stick using the Silk Browser.

ALEXA ROUTINE EXAMPLE (LEVEL 1 COMPLETE)
----------------------------------------
Trigger: "Alexa, level one complete" (or via IFTTT webhook)
Actions:
  - Lights: set to green (or scene)
  - Alexa Announcement: "Algorithm restored. Proceed to next mission."
  - Fire TV: Open website -> https://drive.google.com/uc?export=view&id=MISSION1_FILE_ID

NOTES
-----
- Keep all files together; the HTML references the CSS/JS/WAV by filename.
- Some devices require a tap to allow audio autoplay; the page tries to play automatically and will also play on first tap.
- To adjust on-screen duration, edit the 30000 ms timeout at the bottom of each HTML file.
