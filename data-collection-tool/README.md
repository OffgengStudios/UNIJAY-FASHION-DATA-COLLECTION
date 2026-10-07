# Data Collection Tool

Registration form with a Google Apps Script backend.

## Connection

- [Destination sheet: UNIJAY FASHION DATA COLLECTION](https://docs.google.com/spreadsheets/d/12H6IXz7A0hCjbq8oHLq4Bo_txZBYskm7Z6qycIikpCQ/edit#gid=0)
- Tab: `Sheet1`
- [Apps Script project](https://script.google.com/d/1DlmSCrkBmJmiugdA3w9fsqvch1g8sHWLCdXvVsCYcSMDHnyEMzz6oPIR/edit)
- [Connection check](https://script.google.com/macros/s/AKfycbxifDCyKqY9ADKEeXNUo68YyMpn_VRBoENElTlrJxiB52YbTQIMLDMubpq-oI1g_zFgeA/exec)
- Deployment account: `gideononumah01@gmail.com`

The backend opens the sheet by ID. The frontend's `API_URL` points to the deployed backend.

## Finish Google authorization

The deployment account must have Editor access to the destination sheet.
Open the Apps Script project as that account, select `setupRegistrationSheet`, and click **Run**. Review and grant the requested Google Sheets permission.

The connection check must return `success: true` before collecting registrations.

## Data

The backend appends these seven columns:

1. Record ID
2. Full Name
3. Phone Number
4. Date of Birth
5. Ghana Card
6. Location
7. Date Registered

It validates submissions and rejects matching phone or Ghana Card numbers.
Headers are initialized only when the destination tab is empty; incompatible headers cause an error.

## Local use

Run from this directory:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open <http://127.0.0.1:8765>.
The page uses the supplied favicon assets and has no emoji decorations.

## Backend updates

From the parent project directory:

```powershell
clasp push --force
clasp update-deployment AKfycbxifDCyKqY9ADKEeXNUo68YyMpn_VRBoENElTlrJxiB52YbTQIMLDMubpq-oI1g_zFgeA --description "Registration API update"
```

`.claspignore` limits backend uploads to `Code.gs` and `appsscript.json`.

Keep the destination sheet private and accessible only to authorized staff.
