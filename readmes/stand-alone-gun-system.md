# Stand Alone Gun System (Text-Based)
Simple weapons system built in Python. The `gunsystem` library can be imported into other games; this repo also includes a range demo you can play in the browser (Flask) or in the terminal.

<p float="left">
  <img src="Resources/MainMenu.png" width="250" />
  <img src="Resources/Range Menu.png" width="250" /> 
  <img src="Resources/Shooting.png" width="250" />
</p>

## Set Up and Run
### 1.) Requires Python to be installed
  - Requires Python 3.10 or newer
  - Version used for this build: 3.13.2
  - Get [Python](https://www.python.org/downloads/) here.
  - Run the Installer

### 2.) Download the project (Through Git or File Download)

### 3.) Navigate to the project with Powershell/Command Prompt
  - `cd (drive)/(File Location)/standalonegunsystem`

### 4.) Web version
  - Install Flask once: `pip install flask`
  - Run `python -m webapp`
  - Open http://127.0.0.1:5000 in your browser
  - Menus can be clicked or driven from the keyboard: number keys pick an item, `Esc` goes back

### Web version in Docker
  - Build: `docker build -t gunsystem-web .`
  - Run: `docker run -d --name gunsystem-web -p 8000:8000 gunsystem-web`
  - Open http://127.0.0.1:8000
  - Set `-e GUNSYSTEM_SECRET_KEY=<random string>` to keep range sessions valid across container restarts
  - Balance text reports are saved inside the container; add `-v "${PWD}/Balance Reports:/app/Balance Reports"` to keep them on your machine

### Log in with a portfolio account
  - The range and destroyed count are kept in the browser for 31 days
  - With `PORTFOLIO_SSO_URL` (the portfolio's address) and `PORTFOLIO_SSO_PUBLIC_KEY` (printed by the portfolio's `python sso.py`) set, the top bar offers to log in with a portfolio account. It reads **Log in as** and the portfolio username when this browser is logged in to the portfolio
  - While logged in, that progress is also kept for the portfolio account in `DATA_DIR` (`/app/data` in the container, so add a volume there), and logging in on another browser takes whichever copy is newer
  - Needs `pip install pyjwt[crypto]` as well as Flask

### 5.) Terminal version
  - Run `python ./main.py` (or `python -m demo`)
  - The game starts in your terminal window

## Using as a library
From the repo (or with `gunsystem/` on your Python path):

```python
from gunsystem import Catalog, Target, resolve_shot

gun = Catalog.create("M1911")
gun.reload()
result = resolve_shot(gun, Target(distance=100, size="m"))
```

`result` has `hit`, `damage`, `critical`, `remaining_ammo`, and `fired` (False when the weapon was empty).

## Tests
From the repo root:

```
python -m unittest discover -s tests -t .
```

## V1.5 Features
- Hit Calculation
  - Dummy Size, Damage Drop off, "Bullet Drop", Muzzle Spray, Critical Chance
- Armory Menu to look at all your guns!
- Gun Range to test out all your guns!
  - Bulk Fire report to test weapon balancing
  - Dynamic hit calculation based on Target Distance and Gun Type!
  - Counter to keep track of how many Dummies you have destroyed in the session!
  - Bulk Firing Options Per Gun
- Balance Report Functionality
    - Creates a report per weapon in /Balance Reports
    - Each Report includes stats for 15 Full Magazines shot at:
        - Each Type of Dummy
        - Every Range listed in the Range Menu
        - For Each Firing Mode (Single, 3 Round, Auto)
- 26 Guns, with 6 different weapon types! (See List Below!)

## Future Updates
- More Guns!!!!

## Gun List
### Pistols (Small Arms)
- M1911
- USP .45
- M9
- Desert Eagle
- Glock 18
- .38 Special
- 44 Magnum

### SMG (Small Arms)
- MP5
- AK-47u
- P90
- Mini-Uzi

### Shotguns (Medium Arms)
- W1200
- M1014
- USAS-12
- Spas-12

### ARs (Medium Arms)
- M16A4
- AK47
- G3
- G36
- FN FAL

### Snipers (Large Arms)
- M40A3
- Dragunov
- Barrett .50Cal

### LMGs (Large Arms)
- M249 SAW
- M60E4
- RPD
