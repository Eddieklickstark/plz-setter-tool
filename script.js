(function() {
    // Konfiguration
    var SHEET_URL     = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8BRATZeyiaD0NMh00CWU1bJYZA2XRYA3jrd_XRLg-wWV9UEh9hD___JLuiFZT8nalLamjKMJyc3MJ/pub?gid=0&single=true&output=csv';
    var WEBHOOK_URL   = 'https://hook.eu2.make.com/t9xvbefzv5i8sjcr7u8tiyvau7t1wnlw';
    var CALENDLY_API_KEY = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQ1NTAyNjIxLCJqdGkiOiJhMDEyYTU5Mi1mMDY2LTRhZjctODJkMy00ZjMzYTFmODBiNTMiLCJ1c2VyX3V1aWQiOiJlZGZiZjMxYS0wOWYwLTRlNmYtOTZiOS1lZTRjMWNmN2E3MzkifQ._l2qqiPrQDqfmspZWCHDAFukmK3c0xMCIYN_01wm8YK86PKlAHYn9VRJWCioT5t9axfOdpEyUbhiY_V8Q73U7Q';
    
    var aeMapping     = {};
    var bundeslaender = [];

    // Status‑Variablen
    var calendlyBooked   = false;
    var formSubmitted    = false;
    var exitIntentShown  = false;
    var eventUuid        = null; // Für die Stornierungsfunktion
    var userEmail        = null; // Für das Auto-Fill der E-Mail

    // Reset bei jedem Laden
    localStorage.removeItem('calendlyBooked');
    localStorage.removeItem('formSubmitted');
    localStorage.removeItem('exitIntentShown');
    localStorage.removeItem('eventUuid');
    localStorage.removeItem('userEmail');

    var MAX_RETRIES = 3;
    var COUNTDOWN_SECONDS = 5; // Sekunden für den Countdown nach Stornierung

    console.log('🚀 Script gestartet - Version mit optimierter Stornierungsfunktion');

    // Styles dynamisch hinzufügen
    function addStyles() {
        var css = document.createElement('style');
        css.type = 'text/css';
        css.innerHTML = [
            /* Container */
            '.setter-tool { max-width:800px; margin:0 auto; padding:2rem; border-radius:2rem; font-family:figtree,sans-serif; }',

            /* Überschriften */
            '.section-header { font-size:22px; color:#111827; margin-bottom:16px; font-weight:600; padding-bottom:8px; border-bottom:1px solid #E5E7EB; }',
            '.subsection-header { font-size:18px; color:#374151; margin:16px 0; font-weight:500; }',

            /* Bundesland-Bereich */
            '.bundesland-section { margin-bottom:40px; }',
            '.bundesland-input-container { position:relative; margin-bottom:20px; }',

            /* Input Styles */
            '.ios-input { width:100%; padding:12px; border:1px solid #E5E7EB; border-radius:10px; font-size:16px; background:#FAFAFA; }',
            '.ios-input:focus { outline:none; border-color:#046C4E; background:#FFFFFF; box-shadow:0 0 0 3px rgba(4,108,78,0.1); }',
            '.ios-input[readonly] { background-color:#f0f9ff; border-color:#93c5fd; color:#1e40af; }',

            /* Calendly Placeholder & Container */
            '.calendly-placeholder { background:#F9FAFB; border:2px dashed #E5E7EB; border-radius:12px; padding:40px; text-align:center; color:#6B7280; min-height:400px; display:flex; align-items:center; justify-content:center; }',
            '#calendly-container { margin:20px 0; border-radius:12px; overflow:hidden; background:white; min-height:400px; }',

            /* Formular */
            '.form-section { margin-top:40px; }',
            '.form-group { margin-bottom:32px; }',
            '.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }',
            '@media (max-width:640px){ .form-grid{ grid-template-columns:1fr; } }',
            '.ios-textarea { min-height:120px; resize:vertical; width:100%; }',

            /* Button */
            '.ios-submit { background:#046C4E; color:white; padding:16px 32px; border:none; border-radius:10px; font-size:16px; cursor:pointer; width:100%; margin-top:24px; transition:all .3s ease; }',
            '.ios-submit:hover { background:#065F46; }',
            '.ios-submit:disabled { background:#ccc; cursor:not-allowed; }',

            /* AE-Info */
            '.ae-info { background:#f7fafc; border:1px solid #E5E7EB; border-radius:8px; padding:20px; font-size:18px; }',

            /* Erfolgsmeldung */
            '.success-message { background-color:#28a745; color:#fff; text-align:center; border-radius:12px; padding:15px; margin-top:10px; display:none; }',
            '.success-message p { margin:0; font-family:figtree,sans-serif; }',
            '.success-message p:first-child { font-size:20px; margin-bottom:8px; }',
            '.success-message p:last-child { font-size:14px; }',
            '.show { display:block !important; }',

            /* Overlay für Ladeanimation */
            '.overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); display:none; align-items:center; justify-content:center; z-index:9999; }',
            '.overlay.show { display:flex; }',
            '.spinner { width:50px; height:50px; border:6px solid #f3f3f3; border-top:6px solid #046C4E; border-radius:50%; animation:spin 1s linear infinite; }',
            '@keyframes spin { 0%{ transform:rotate(0deg); } 100%{ transform:rotate(360deg); } }',

            /* Exit Intent Styling */
            '.exit-intent-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:10000; }',
            '.exit-intent-dialog { max-width:500px; width:90%; background:white; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.2); padding:30px; position:relative; font-family:figtree,sans-serif; }',
            '.exit-intent-close { position:absolute; top:15px; right:15px; font-size:24px; line-height:1; cursor:pointer; color:#6B7280; }',
            '.exit-intent-title { font-size:24px; font-weight:600; color:#111827; margin-bottom:16px; }',
            '.exit-intent-message { font-size:16px; color:#4B5563; margin-bottom:24px; line-height:1.6; }',
            '.exit-intent-buttons { display:flex; gap:12px; justify-content:flex-end; }',
            '.exit-intent-button-primary { background-color:#046C4E; color:white; padding:12px 20px; border-radius:8px; font-weight:500; border:none; cursor:pointer; transition:background-color .2s; }',
            '.exit-intent-button-primary:hover { background-color:#065F46; }',
            '.exit-intent-button-secondary { background-color:#F3F4F6; color:#374151; padding:12px 20px; border-radius:8px; font-weight:500; border:none; cursor:pointer; transition:background-color .2s; }',
            '.exit-intent-button-secondary:hover { background-color:#E5E7EB; }',
            '#contact-form { display:none; opacity:0; transition:opacity .3s ease; }',
            
            /* Email Hilfe & Tooltip */
            '.email-hint { background:#f0f9ff; border:1px solid #93c5fd; border-radius:8px; padding:10px 12px; margin:4px 0 12px; font-size:13px; color:#1e40af; display:none; }',
            '.email-hint.show { display:block; }',
            '.help-icon { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; background:#e0f2fe; color:#0369a1; border-radius:50%; font-size:14px; margin-left:8px; cursor:pointer; user-select:none; font-weight:bold; }',
            '.help-icon:hover { background:#bae6fd; }',
            '.tooltip { position:absolute; right:0; top:calc(100% + 10px); background:white; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.15); padding:15px; width:300px; z-index:100; display:none; font-size:14px; line-height:1.5; color:#374151; }',
            '.tooltip.show { display:block; }',
            '.tooltip-title { font-weight:600; margin-bottom:8px; color:#111827; }',
            '.tooltip-close { position:absolute; top:8px; right:10px; cursor:pointer; font-size:16px; color:#9ca3af; }',
            '.tooltip-close:hover { color:#4b5563; }',
            '.email-container { position:relative; }',
            '.tooltip-button { display:inline-block; margin-top:8px; background:#0284c7; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:13px; transition:background 0.2s; }',
            '.tooltip-button:hover { background:#0369a1; }',
            
            /* Stornierungsfunktion */
            '.cancel-button { background:#ef4444; color:white; padding:12px 16px; border:none; border-radius:8px; cursor:pointer; font-size:15px; font-weight:500; transition:background 0.2s; width:100%; text-align:center; }',
            '.cancel-button:hover { background:#dc2626; }',
            '.cancel-button:disabled { background:#f87171; cursor:not-allowed; }',
            '.cancel-success { background:#10b981; color:white; padding:15px; border-radius:8px; margin-top:15px; text-align:center; display:none; }',
            '.cancel-success.show { display:block; }',
            '.cancel-error { background:#ef4444; color:white; padding:15px; border-radius:8px; margin-top:15px; text-align:center; display:none; }',
            '.cancel-error.show { display:block; }',
            '.reason-textarea { width:100%; padding:10px; margin-top:10px; margin-bottom:15px; border:1px solid #d1d5db; border-radius:8px; min-height:80px; font-family:inherit; font-size:14px; }',
            '.spinner-small { width:16px; height:16px; border:3px solid rgba(255,255,255,0.3); border-top:3px solid white; border-radius:50%; animation:spin 1s linear infinite; display:none; margin-left:8px; vertical-align:middle; }',
            '.spinner-small.show { display:inline-block; }',
            '.reason-container { margin-top:15px; margin-bottom:15px; }',
            '.cancel-dialog { max-width:450px; width:90%; background:white; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.2); padding:25px; position:relative; }',
            '.cancel-title { font-size:20px; font-weight:600; color:#111827; margin-bottom:12px; }',
            '.cancel-message { font-size:15px; color:#4B5563; margin-bottom:15px; line-height:1.5; }',
            '.countdown { font-weight:bold; color:#046C4E; }',
            '.cancel-info { font-size:14px; color:#6B7280; margin-top:5px; }',
            '.storno-section { padding:20px; background:#fff8f8; border-radius:8px; margin-top:15px; border:1px solid #fecaca; }',
            '.storno-title { font-size:16px; font-weight:600; color:#991b1b; margin-bottom:10px; }',
            '.storno-description { font-size:14px; line-height:1.5; color:#4b5563; margin-bottom:15px; }'
        ].join('\n');
        document.head.appendChild(css);
    }

    // HTML-Struktur aufbauen
    function createStructure() {
        var container = document.querySelector('.setter-tool');
        if (!container) return;
        container.innerHTML = `
            <div class="bundesland-section">
                <h2 class="section-header">Terminbuchung</h2>
                <h3 class="subsection-header">Schritt 1 – Calendly Termin buchen</h3>
                <div class="bundesland-input-container">
                    <select id="bundesland-select" class="ios-input required">
                        <option value="">Bundesland wählen...</option>
                    </select>
                </div>
                <div id="ae-result"></div>
            </div>
            <div id="calendly-container">
                <div class="calendly-placeholder">Bitte wählen Sie zuerst ein Bundesland aus, um den Kalender zu laden.</div>
            </div>

            <h3 class="subsection-header">Schritt 2 – Daten eintragen</h3>
            <p id="form-hint" style="background:#fff8db;border:1px solid #fcd34d;padding:12px;border-radius:8px;color:#92400e;font-size:14px;margin-bottom:24px;">
                Das Formular wird sichtbar, sobald ein Termin über Calendly gebucht wurde.
            </p>
            <form id="contact-form" class="form-section">
                <h2 class="section-header">Kontaktinformationen</h2>
                <input type="hidden" id="bundesland-hidden" name="bundesland" value="">

                <!-- Stornierungsbereich (nur für AEs) -->
                <div class="storno-section" id="storno-section">
                    <div class="storno-title">E-Mail-Adresse falsch?</div>
                    <div class="storno-description">
                        Wenn die bei der Buchung verwendete E-Mail-Adresse nicht korrekt ist, können Sie hier den Termin stornieren und anschließend einen neuen Termin mit der korrekten E-Mail-Adresse buchen.
                    </div>
                    <div class="reason-container">
                        <label for="cancel-reason">Stornierungsgrund (optional):</label>
                        <textarea id="cancel-reason" class="reason-textarea" placeholder="Falscher Kontakt, Termin wird neu mit korrekter E-Mail gebucht"></textarea>
                    </div>
                    <button type="button" class="cancel-button" id="calendly-cancel">
                        Termin stornieren
                        <span class="spinner-small" id="cancel-spinner"></span>
                    </button>
                    <div class="cancel-success" id="cancel-success">
                        Termin erfolgreich storniert. Die Seite wird in <span id="countdown" class="countdown">5</span> Sekunden neu geladen.
                    </div>
                    <div class="cancel-error" id="cancel-error">
                        Fehler bei der Stornierung. Bitte versuchen Sie es erneut oder nutzen Sie den Link in Ihrer Bestätigungs-E-Mail.
                    </div>
                </div>

                <!-- Flächeninformationen -->
                <div class="form-group">
                    <h3 class="subsection-header">Flächeninformationen</h3>
                    <div class="form-grid">
                        <select class="ios-input required" name="flaechenart" required>
                            <option value="">Flächenart wählen*</option>
                            <option value="Freifläche">Freifläche</option>
                            <option value="Dachfläche">Dachfläche</option>
                        </select>
                        <select class="ios-input required" name="flaechengroesse" required>
                            <option value="">Flächengröße wählen*</option>
                            <option value="Weniger als 2.000qm">Weniger als 2.000qm</option>
                            <option value="2.000 bis 4.000qm">2.000 bis 4.000qm</option>
                            <option value="Mehr als 4.000qm">Mehr als 4.000qm</option>
                        </select>
                        <select class="ios-input required" name="stromverbrauch" required>
                            <option value="">Stromverbrauch wählen*</option>
                            <option value="unter 100.000 kWh">unter 100.000 kWh</option>
                            <option value="100.000 - 500.000 kWh">100.000 - 500.000 kWh</option>
                            <option value="500.000 - 1 Mio kWh">500.000 - 1 Mio kWh</option>
                            <option value="über 1 Mio kWh">über 1 Mio kWh</option>
                        </select>
                        <input type="number" class="ios-input required" name="standorte" placeholder="Anzahl der Standorte*" required>
                    </div>
                </div>

                <!-- Standortinformationen -->
                <div class="form-group">
                    <h3 class="subsection-header">Standortinformationen</h3>
                    <div class="form-grid">
                        <input type="text" class="ios-input required" name="strasse" placeholder="Standort Straße*" required>
                        <input type="text" class="ios-input required" name="hausnummer" placeholder="Standort Hausnummer*" required>
                        <input type="text" class="ios-input required" name="plz" placeholder="Standort Postleitzahl*" required>
                        <input type="text" class="ios-input required" name="stadt" placeholder="Standort Stadt*" required>
                    </div>
                </div>

                <!-- Unternehmensinformationen -->
                <div class="form-group">
                    <h3 class="subsection-header">Unternehmensinformationen</h3>
                    <div class="form-grid">
                        <input type="text" class="ios-input required" name="firma" placeholder="Firma*" required>
                        <select class="ios-input required" name="branche" required>
                            <option value="">Branche wählen*</option>
                            <option value="Glashersteller">Glashersteller</option>
                            <option value="Investmentfirma">Investmentfirma</option>
                            <option value="Sporthalle">Sporthalle</option>
                            <option value="Privatperson">Privatperson</option>
                            <option value="Stadien">Stadien</option>
                            <option value="Brauerei">Brauerei</option>
                            <option value="Isoliertechnik">Isoliertechnik</option>
                            <option value="Vermögensverwaltung">Vermögensverwaltung</option>
                            <option value="Spedition">Spedition</option>
                            <option value="Bauprojektentwickler">Bauprojektentwickler</option>
                            <option value="Textilindustrie">Textilindustrie</option>
                            <option value="Maschinenbauunternehmen">Maschinenbauunternehmen</option>
                            <option value="Metallindustrie">Metallindustrie</option>
                            <option value="Immobilien">Immobilien</option>
                            <option value="Elektroindustrie">Elektroindustrie</option>
                            <option value="Dienstleistungen">Dienstleistungen</option>
                            <option value="Lebensmittelindustrie">Lebensmittelindustrie</option>
                            <option value="Logistik/Fulfillment">Logistik/Fulfillment</option>
                            <option value="Rechenzentren">Rechenzentren</option>
                            <option value="MedTech">MedTech</option>
                            <option value="Entsorger">Entsorger</option>
                            <option value="Automobilindustrie">Automobilindustrie</option>
                            <option value="Möbelindustrie">Möbelindustrie</option>
                            <option value="Gewerbeflächen">Gewerbeflächen</option>
                            <option value="Elektroinstallation">Elektroinstallation</option>
                            <option value="Verpackungstechnik">Verpackungstechnik</option>
                            <option value="Recyclingtechnik">Recyclingtechnik</option>
                            <option value="Farben- und Lackbranche">Farben- und Lackbranche</option>
                            <option value="Hersteller von Batterien">Hersteller von Batterien</option>
                            <option value="Landwirtschaft">Landwirtschaft</option>
                            <option value="Kunststoffindustrie">Kunststoffindustrie</option>
                            <option value="Papierindustrie">Papierindustrie</option>
                            <option value="Großhandel">Großhandel</option>
                            <option value="Druckerei">Druckerei</option>
                            <option value="Behörde">Behörde</option>
                            <option value="Geschlossen">Geschlossen</option>
                            <option value="Frachtspeditionsdienst">Frachtspeditionsdienst</option>
                            <option value="Lackindustrie">Lackindustrie</option>
                            <option value="Elektrogeräte Hersteller">Elektrogeräte Hersteller</option>
                        </select>
                    </div>
                </div>

                <!-- Kontaktperson -->
                <div class="form-group">
                    <h3 class="subsection-header">Kontaktperson</h3>
                    <div class="form-grid">
                        <select class="ios-input required" name="anrede" required>
                            <option value="">Anrede wählen*</option>
                            <option value="herr">Herr</option>
                            <option value="frau">Frau</option>
                        </select>
                        <div></div>
                        <input type="text" class="ios-input required" name="vorname" placeholder="Vorname*" required>
                        <input type="text" class="ios-input required" name="nachname" placeholder="Nachname*" required>
                        <input type="text" class="ios-input required" name="position" placeholder="Position*" required>
                        <input type="email" class="ios-input required" id="email-field" name="email" placeholder="E-Mail*" required>
                        <input type="tel" class="ios-input required" name="festnetz" placeholder="Festnetznummer* – Nur Zahlen!" required>
                        <input type="tel" class="ios-input" name="mobil" placeholder="Mobil – Nur Zahlen!">
                        <input type="url" class="ios-input" name="linkedin" placeholder="LinkedIn Profil: https://www.linkedin.com/in/beispiel" style="grid-column:span 2;">
                    </div>
                </div>

                <!-- Gesprächsnotiz -->
                <div class="form-group">
                    <h3 class="subsection-header">Gesprächsnotiz*</h3>
                    <textarea class="ios-input ios-textarea required" name="gespraechsnotiz" placeholder="Gesprächsnotiz – Bitte ausführlich (mind. 3 Sätze)." required></textarea>
                </div>

                <button type="submit" class="ios-submit">Informationen senden</button>

                <div class="success-message" id="success-message">
                    <p>Daten wurden erfolgreich gespeichert!</p>
                    <p>Die Seite wird jetzt neu geladen</p>
                </div>
            </form>

            <div class="overlay" id="loading-overlay">
                <div class="spinner"></div>
            </div>
        `;
        // Formular initial verstecken
        var form = document.getElementById('contact-form');
        if (form) { form.style.display = 'none'; form.style.opacity = '0'; }
        
        // Stornierungsbereich initial verstecken (wird nur für AEs angezeigt)
        var stornoSection = document.getElementById('storno-section');
        if (stornoSection) { stornoSection.style.display = 'none'; }
    }

    // Bundesländer-Liste befüllen
    function updateBundeslandSelect() {
        var sel = document.getElementById('bundesland-select');
        if (!sel) return;
        sel.innerHTML = '<option value="">Bundesland wählen...</option>';
        bundeslaender.forEach(function(bl) {
            sel.innerHTML += '<option value="'+bl+'">'+bl+'</option>';
        });
    }

    // AE-Daten aus Google Sheet laden
    function loadAEData() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', SHEET_URL, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                Papa.parse(xhr.responseText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        aeMapping     = {};
                        bundeslaender = [];
                        results.data.forEach(function(row) {
                            if (row.Bundesland && row.name) {
                                var bl = row.Bundesland.trim();
                                aeMapping[bl] = {
                                    name: row.name.trim(),
                                    calendlyLink: row.calendly_link ? row.calendly_link.trim() : ''
                                };
                                if (bundeslaender.indexOf(bl) === -1) {
                                    bundeslaender.push(bl);
                                }
                            }
                        });
                        updateBundeslandSelect();
                    }
                });
            }
        };
        xhr.send();
    }

    // UI aktualisieren nach Auswahl
    function updateUI(ae, bundesland) {
        var resultDiv   = document.getElementById('ae-result');
        var calendlyDiv = document.getElementById('calendly-container');
        if (!resultDiv || !calendlyDiv) return;
        if (ae) {
            resultDiv.innerHTML = '<div class="ae-info"><p><strong>Account Executive '+bundesland+':</strong> '+ae.name+'</p></div>';
            if (ae.calendlyLink) {
                calendlyDiv.innerHTML = '<div class="calendly-inline-widget" data-url="'+ae.calendlyLink+'?hide_gdpr_banner=1&hide_event_type_details=1&hide_landing_page_details=1&background_color=ffffff&hide_title=1" style="min-width:320px;height:700px;"></div>';
                if (window.Calendly) {
                    window.Calendly.initInlineWidget({
                        url: ae.calendlyLink+'?hide_gdpr_banner=1&hide_event_type_details=1&hide_landing_page_details=1&background_color=ffffff&hide_title=1',
                        parentElement: calendlyDiv.querySelector('.calendly-inline-widget')
                    });
                }
            } else {
                calendlyDiv.innerHTML = '<div class="calendly-placeholder">Kein Kalenderlink verfügbar.</div>';
            }
        } else {
            calendlyDiv.innerHTML = '<div class="calendly-placeholder">Bitte wählen Sie zuerst ein Bundesland aus.</div>';
        }
    }

    // Funktion zum Stornieren eines Termins - Angepasst für aktuelle API-Struktur
    async function cancelEvent(uuid, reason) {
        console.log('🔄 Versuche Termin zu stornieren:', uuid);
        
        try {
            // Calendly-API für Stornierung aufrufen
            const response = await fetch(`https://api.calendly.com/scheduled_events/${uuid}/cancellation`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + CALENDLY_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: reason || 'Falscher Kontakt, Termin wird neu gebucht'
                })
            });
            
            console.log('📡 API-Antwort:', response.status);
            
            // Prüfen, ob die Anfrage erfolgreich war
            if (response.status === 201 || response.status === 204) {
                // 201 Created oder 204 No Content sind Erfolgs-Status-Codes
                let data = {};
                if (response.status !== 204) {
                    try {
                        data = await response.json();
                    } catch (e) {
                        // Ignorieren, falls kein JSON zurückgegeben wurde
                    }
                }
                console.log('✅ Stornierung erfolgreich!');
                return { success: true, data };
            } 
            // Spezielle Fehlerbehandlung für CORS-Probleme
            else if (response.status === 403) {
                console.warn('⚠️ Fehler 403: Möglicherweise CORS-Problem. Versuche Alternative...');
                
                // Alternativ können wir eine Redirect-Lösung anbieten
                const cancelUrl = `https://calendly.com/cancellations/${uuid}`;
                if (confirm('Die direkte Stornierung ist fehlgeschlagen. Möchten Sie zur Calendly-Stornierungsseite weitergeleitet werden?')) {
                    window.open(cancelUrl, '_blank');
                    return { success: true, redirect: true };
                }
                return { success: false, error: 'Direkte Stornierung nicht möglich. Bitte nutzen Sie den Link in Ihrer Bestätigungs-E-Mail.' };
            } 
            else {
                let errorText;
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = `Fehler ${response.status}`;
                }
                console.error('❌ Stornierung fehlgeschlagen:', errorText);
                return { success: false, error: errorText, status: response.status };
            }
        } catch (error) {
            console.error('❌ Fehler bei der Stornierungsanfrage:', error);
            
            // Alternativ können wir eine Redirect-Lösung anbieten
            const cancelUrl = `https://calendly.com/cancellations/${uuid}`;
            if (confirm('Die direkte Stornierung ist fehlgeschlagen. Möchten Sie zur Calendly-Stornierungsseite weitergeleitet werden?')) {
                window.open(cancelUrl, '_blank');
                return { success: true, redirect: true };
            }
            
            return { success: false, error: error.message };
        }
    }

    // Countdown für Seitenneuladen nach Stornierung
    function startCountdown(seconds) {
        const countdownEl = document.getElementById('countdown');
        if (!countdownEl) return;
        
        let remainingSeconds = seconds;
        countdownEl.textContent = remainingSeconds;
        
        const countdownInterval = setInterval(() => {
            remainingSeconds--;
            countdownEl.textContent = remainingSeconds;
            
            if (remainingSeconds <= 0) {
                clearInterval(countdownInterval);
                window.location.reload();
            }
        }, 1000);
    }

    // E-Mail aus Calendly-Ereignisdaten extrahieren - Angepasst für die aktuellen API-Endpunkte
    async function fetchCalendlyEvent(eventUuid) {
        try {
            // Richtig formatierter API-Endpunkt für Calendly
            // Zuerst versuchen wir, die Invitee-Informationen zu bekommen, da diese die E-Mail direkt enthalten
            console.log('🔄 Rufe Invitee-Informationen ab für Event:', eventUuid);
            
            const inviteesUrl = `https://api.calendly.com/scheduled_events/${eventUuid}/invitees`;
            const response = await fetch(inviteesUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + CALENDLY_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn(`⚠️ Invitees API-Fehler: ${response.status}. Versuche alternativen Endpunkt...`);
                return extractEmailFromPayload(); // Fallback zur E-Mail-Extraktion aus dem payload
            }
            
            const data = await response.json();
            console.log('✅ Invitee-Daten erhalten:', data);
            
            // E-Mail aus der Antwort extrahieren
            if (data.collection && data.collection.length > 0) {
                const invitee = data.collection[0];
                if (invitee.email) {
                    const email = invitee.email;
                    console.log('📧 E-Mail aus Invitee-Daten gefunden:', email);
                    userEmail = email;
                    localStorage.setItem('userEmail', email);
                    fillEmailField(email);
                    return email;
                }
            }
            
            // Wenn wir hier ankommen, wurde keine E-Mail gefunden
            console.warn('⚠️ Keine E-Mail in den Invitee-Daten gefunden. Versuche Fallback...');
            return extractEmailFromPayload();
            
        } catch (error) {
            console.error('❌ Fehler beim Abrufen der Calendly-Daten:', error);
            return extractEmailFromPayload(); // Fallback-Methode
        }
    }
    
    // Fallback: E-Mail aus dem Payload-Objekt extrahieren, falls die API-Anfrage fehlschlägt
    function extractEmailFromPayload() {
        try {
            // Versuchen wir, die E-Mail aus dem localStorage oder DOM zu extrahieren
            
            // 1. Prüfen, ob wir die E-Mail im localStorage haben
            const storedEmail = localStorage.getItem('calendlyEmail');
            if (storedEmail) {
                console.log('📧 E-Mail aus localStorage gefunden:', storedEmail);
                userEmail = storedEmail;
                fillEmailField(storedEmail);
                return storedEmail;
            }
            
            // 2. Calendly-Widget prüfen (manchmal speichert es die E-Mail im DOM)
            const calendlyFrame = document.querySelector('.calendly-inline-widget iframe');
            if (calendlyFrame && calendlyFrame.contentWindow) {
                // Versuchen, auf Calendly-Daten im iframe zuzugreifen
                try {
                    const frameContent = calendlyFrame.contentWindow.document;
                    const emailInput = frameContent.querySelector('input[type="email"]');
                    if (emailInput && emailInput.value) {
                        const email = emailInput.value;
                        console.log('📧 E-Mail aus Calendly-Widget gefunden:', email);
                        userEmail = email;
                        localStorage.setItem('userEmail', email);
                        fillEmailField(email);
                        return email;
                    }
                } catch (frameError) {
                    console.warn('⚠️ Konnte nicht auf Calendly-Widget zugreifen:', frameError);
                }
            }
            
            console.warn('⚠️ Keine E-Mail gefunden. Formular wird ohne vorbefüllte E-Mail angezeigt');
            return null;
        } catch (error) {
            console.error('❌ Fehler bei E-Mail-Extraktion:', error);
            return null;
        }
    }

    // E-Mail-Feld im Formular ausfüllen
    function fillEmailField(email) {
        if (!email) return false;
        
        var emailField = document.getElementById('email-field');
        if (!emailField) return false;
        
        emailField.value = email;
        emailField.setAttribute('readonly', 'readonly');
        
        // Visuelle Rückmeldung
        emailField.style.backgroundColor = '#f0f9ff';
        emailField.style.borderColor = '#93c5fd';
        emailField.style.color = '#1e40af';
        
        console.log('✅ E-Mail-Feld ausgefüllt mit:', email);
        return true;
    }

    // Formular-Daten senden mit Retry
    async function sendFormData(data, attempt = 1) {
        try {
            var res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) return true;
            throw new Error('Nicht ok: '+res.statusText);
        } catch (err) {
            console.error('Fehler beim Senden (Versuch '+attempt+'): ', err);
            if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r,1500));
                return sendFormData(data, attempt+1);
            }
            return false;
        }
    }

    function showLoadingOverlay() {
        var ov = document.getElementById('loading-overlay');
        if (ov) ov.classList.add('show');
    }
    function hideLoadingOverlay() {
        var ov = document.getElementById('loading-overlay');
        if (ov) ov.classList.remove('show');
    }

    // Exit‑Intent-Logik
    function checkShowExitIntent(isBeforeUnload) {
        if (calendlyBooked && !formSubmitted && (!exitIntentShown || isBeforeUnload)) {
            if (!isBeforeUnload) {
                showExitIntentDialog();
                exitIntentShown = true;
                localStorage.setItem('exitIntentShown','true');
            }
            return true;
        }
        return false;
    }
    function showExitIntentDialog() {
        var html = `
            <div class="exit-intent-overlay" id="exit-intent-overlay">
              <div class="exit-intent-dialog">
                <div class="exit-intent-close" id="exit-intent-close">&times;</div>
                <div class="exit-intent-title">Moment noch!</div>
                <div class="exit-intent-message">
                  <p>Sie haben einen Termin gebucht, aber das Formular noch nicht abgesendet.</p>
                  <p>Bitte vervollständigen Sie die Angaben.</p>
                </div>
                <div class="exit-intent-buttons">
                  <button class="exit-intent-button-secondary" id="exit-intent-leave">Trotzdem verlassen</button>
                  <button class="exit-intent-button-primary" id="exit-intent-complete">Formular ausfüllen</button>
                </div>
              </div>
            </div>`;
        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
        document.getElementById('exit-intent-close').addEventListener('click', closeExitIntentDialog);
        document.getElementById('exit-intent-leave').addEventListener('click', function() {
            localStorage.removeItem('calendlyBooked');
            closeExitIntentDialog();
        });
        document.getElementById('exit-intent-complete').addEventListener('click', function(){
            closeExitIntentDialog();
            var f = document.getElementById('contact-form');
            if(f) f.scrollIntoView({behavior:'smooth',block:'start'});
        });
    }
    function closeExitIntentDialog() {
        var el = document.getElementById('exit-intent-overlay');
        if (el) el.remove();
    }
    function setupExitIntent() {
        document.addEventListener('mouseleave', function(e){
            if(e.clientY <= 5) checkShowExitIntent();
        });
        window.addEventListener('beforeunload', function(e){
            if (checkShowExitIntent(true)) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    }

    // Initialisierung
    function init() {
        addStyles();
        createStructure();
        loadAEData();

        // Formular beim Start verstecken
        setTimeout(function(){
            var f = document.getElementById('contact-form');
            if(f) { f.style.display='none'; f.style.opacity='0'; }
        },100);

        // Bundesland-Auswahl
        var sel = document.getElementById('bundesland-select');
        if (sel) {
            sel.addEventListener('change', function(){
                var bl = this.value;
                document.getElementById('bundesland-hidden').value = bl;
                updateUI(aeMapping[bl], bl);
            });
        }

        // Formular‑Submit
        var form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', async function(e){
                e.preventDefault();
                formSubmitted = true;
                localStorage.setItem('formSubmitted','true');
                var btn = form.querySelector('.ios-submit');
                if(btn) btn.disabled = true;
                showLoadingOverlay();

                var data = Object.fromEntries(new FormData(e.target));
                console.log('Sende Daten:', data);
                var ok = await sendFormData(data);

                hideLoadingOverlay();
                if (ok) {
                    var msg = document.getElementById('success-message');
                    if(msg) msg.classList.add('show');
                    setTimeout(function(){
                        if(msg) msg.classList.remove('show');
                        setTimeout(function(){
                            window.scrollTo({top:0,behavior:'smooth'});
                            window.location.reload();
                        },1000);
                    },2000);
                } else {
                    alert('Fehler beim Speichern. Bitte erneut versuchen.');
                    if(btn) btn.disabled = false;
                }
            });
        }
        
        // Stornierungsbutton
        var cancelButton = document.getElementById('calendly-cancel');
        var cancelReason = document.getElementById('cancel-reason');
        var cancelSpinner = document.getElementById('cancel-spinner');
        var cancelSuccess = document.getElementById('cancel-success');
        var cancelError = document.getElementById('cancel-error');
        
        if (cancelButton) {
            cancelButton.addEventListener('click', async function() {
                if (!eventUuid) {
                    alert('Konnte keine Event-ID finden. Bitte nutzen Sie den Stornierungslink in Ihrer Bestätigungs-E-Mail.');
                    return;
                }
                
                // Button-Status: Lädt
                cancelButton.disabled = true;
                if (cancelSpinner) cancelSpinner.classList.add('show');
                if (cancelSuccess) cancelSuccess.classList.remove('show');
                if (cancelError) cancelError.classList.remove('show');
                
                const reason = cancelReason ? cancelReason.value : '';
                const result = await cancelEvent(eventUuid, reason);
                
                if (result.success) {
                    if (cancelSuccess) cancelSuccess.classList.add('show');
                    
                    // Status zurücksetzen
                    calendlyBooked = false;
                    localStorage.removeItem('calendlyBooked');
                    localStorage.removeItem('eventUuid');
                    localStorage.removeItem('userEmail');
                    
                    // Countdown starten und dann Seite neu laden
                    startCountdown(COUNTDOWN_SECONDS);
                } else {
                    if (cancelError) cancelError.classList.add('show');
                    cancelButton.disabled = false;
                    if (cancelSpinner) cancelSpinner.classList.remove('show');
                }
            });
        }
    }

    // Abhängigkeiten laden
    function loadDependencies() {
        var papa = document.createElement('script');
        papa.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js';
        papa.onload = function(){
            var cal = document.createElement('script');
            cal.src   = 'https://assets.calendly.com/assets/external/widget.js';
            cal.async = true;
            cal.onload = init;
            document.head.appendChild(cal);
        };
        document.head.appendChild(papa);
    }

    // Document Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDependencies);
    } else {
        loadDependencies();
    }

    // Calendly-Event-Listener mit verbesserter Fehlerbehandlung
    window.addEventListener('message', function(e) {
        if (e.data.event === 'calendly.event_scheduled') {
            console.log('✅ Termin gebucht!', e.data);
            
            try {
                // Status setzen
                calendlyBooked = true;
                localStorage.setItem('calendlyBooked', 'true');
                
                // E-Mail direkt aus dem Payload extrahieren, wenn verfügbar
                const payload = e.data.payload || {};
                let emailFromPayload = null;
                
                // E-Mail aus dem Payload extrahieren (verschiedene mögliche Pfade prüfen)
                if (payload.invitee && payload.invitee.email) {
                    emailFromPayload = payload.invitee.email;
                    console.log('📧 E-Mail aus Payload gefunden:', emailFromPayload);
                    userEmail = emailFromPayload;
                    localStorage.setItem('userEmail', emailFromPayload);
                    // Email gleich ins Formular eintragen
                    setTimeout(() => {
                        fillEmailField(emailFromPayload);
                    }, 100);
                }
                
                // Event-UUID für Stornierung extrahieren
                const eventUri = payload.event ? payload.event.uri : null;
                
                if (eventUri) {
                    // UUID aus der URI extrahieren
                    eventUuid = eventUri.split('/').pop();
                    console.log('📝 Event-UUID für Stornierung gespeichert:', eventUuid);
                    localStorage.setItem('eventUuid', eventUuid);
                    
                    // E-Mail über die Calendly API abrufen, falls nicht im Payload
                    if (!emailFromPayload) {
                        fetchCalendlyEvent(eventUuid);
                    }
                } else {
                    console.warn('⚠️ Keine Event-URI im Calendly-Event gefunden');
                }
                
                // Formular anzeigen
                var form = document.getElementById('contact-form');
                var hint = document.getElementById('form-hint');
                var stornoSection = document.getElementById('storno-section');
                
                if (form) {
                    form.style.display = 'block';
                    setTimeout(function() { 
                        form.style.opacity = '1';
                        
                        // AEs können den Storno-Bereich sehen (basierend auf Domain-Name oder URL-Parameter)
                        const isAE = window.location.hostname.includes('admin') || 
                                    window.location.href.includes('ae=true') ||
                                    window.location.pathname.includes('/admin/');
                        
                        if (isAE && stornoSection) {
                            stornoSection.style.display = 'block';
                        }
                    }, 50);
                }
                
                if (hint) {
                    hint.style.display = 'none';
                }
                
                // Exit Intent aktivieren
                setupExitIntent();
                console.log('🔄 Exit Intent aktiviert');
            } catch (error) {
                console.error('❌ Fehler bei der Verarbeitung des Calendly-Events:', error);
                
                // Minimale Sicherheitsmaßnahme: Formular trotzdem anzeigen
                var form = document.getElementById('contact-form');
                var hint = document.getElementById('form-hint');
                
                if (form) {
                    form.style.display = 'block';
                    setTimeout(function() { form.style.opacity = '1'; }, 50);
                }
                
                if (hint) {
                    hint.style.display = 'none';
                }
            }
        }
    });
})();
