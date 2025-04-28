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

    // Reset bei jedem Laden
    localStorage.removeItem('calendlyBooked');
    localStorage.removeItem('formSubmitted');
    localStorage.removeItem('exitIntentShown');
    localStorage.removeItem('calendlyInviteeUri');
    localStorage.removeItem('calendlyEmail');

    var MAX_RETRIES = 3;

    // Styles dynamisch hinzufügen
    function addStyles() {
        var css = document.createElement('style');
        css.type = 'text/css';
        css.innerHTML = [
            '.setter-tool { max-width:800px; margin:0 auto; padding:2rem; border-radius:2rem; font-family:figtree,sans-serif; }',
            '.section-header { font-size:22px; color:#111827; margin-bottom:16px; font-weight:600; padding-bottom:8px; border-bottom:1px solid #E5E7EB; }',
            '.subsection-header { font-size:18px; color:#374151; margin:16px 0; font-weight:500; }',
            '.bundesland-section { margin-bottom:40px; }',
            '.bundesland-input-container { position:relative; margin-bottom:20px; }',
            '.ios-input { width:100%; padding:12px; border:1px solid #E5E7EB; border-radius:10px; font-size:16px; background:#FAFAFA; }',
            '.ios-input:focus { outline:none; border-color:#046C4E; background:#FFFFFF; box-shadow:0 0 0 3px rgba(4,108,78,0.1); }',
            '.ios-input[readonly] { background-color:#f0f9ff; border-color:#93c5fd; color:#1e40af; }',
            '.calendly-placeholder { background:#F9FAFB; border:2px dashed #E5E7EB; border-radius:12px; padding:40px; text-align:center; color:#6B7280; min-height:400px; display:flex; align-items:center; justify-content:center; }',
            '#calendly-container { margin:20px 0; border-radius:12px; overflow:hidden; background:white; min-height:400px; }',
            '.form-section { margin-top:40px; }',
            '.form-group { margin-bottom:32px; }',
            '.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }',
            '@media (max-width:640px){ .form-grid{ grid-template-columns:1fr; } }',
            '.ios-textarea { min-height:120px; resize:vertical; width:100%; }',
            '.ios-submit { background:#046C4E; color:white; padding:16px 32px; border:none; border-radius:10px; font-size:16px; cursor:pointer; width:100%; margin-top:24px; transition:all .3s ease; }',
            '.ios-submit:hover { background:#065F46; }',
            '.ios-submit:disabled { background:#ccc; cursor:not-allowed; }',
            '.ae-info { background:#f7fafc; border:1px solid #E5E7EB; border-radius:8px; padding:20px; font-size:18px; }',
            '.success-message { background-color:#28a745; color:#fff; text-align:center; border-radius:12px; padding:15px; margin-top:10px; display:none; }',
            '.success-message p { margin:0; font-family:figtree,sans-serif; }',
            '.success-message p:first-child { font-size:20px; margin-bottom:8px; }',
            '.success-message p:last-child { font-size:14px; }',
            '.show { display:block !important; }',
            '.overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); display:none; align-items:center; justify-content:center; z-index:9999; }',
            '.overlay.show { display:flex; }',
            '.spinner { width:50px; height:50px; border:6px solid #f3f3f3; border-top:6px solid #046C4E; border-radius:50%; animation:spin 1s linear infinite; }',
            '@keyframes spin { 0%{ transform:rotate(0deg); } 100%{ transform:rotate(360deg); } }',
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
            '#contact-form { display:none; opacity:0; transition:opacity .3s ease; }'
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
                        <input type="email" class="ios-input required" name="email" placeholder="E-Mail*" required>
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

    // Calendly API abfragen für E-Mail-Adresse
    async function fetchInviteeEmail(inviteeUri) {
        try {
            console.log('🔍 Rufe Calendly API für Invitee-Details auf:', inviteeUri);
            
            const response = await fetch(inviteeUri, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + CALENDLY_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('API Fehler: ' + response.status);
            }
            
            const data = await response.json();
            console.log('✓ Calendly API-Antwort erhalten:', data);
            
            // E-Mail aus der API-Antwort extrahieren
            const email = data.resource && data.resource.email 
                ? data.resource.email 
                : null;
            
            if (email) {
                console.log('✓ E-Mail aus Calendly API erhalten:', email);
                localStorage.setItem('calendlyEmail', email);
                
                // E-Mail in das Formular eintragen
                fillEmailField(email);
                return email;
            } else {
                console.error('⚠️ Keine E-Mail in der API-Antwort gefunden');
                return null;
            }
        } catch (error) {
            console.error('❌ Fehler beim API-Aufruf:', error);
            return null;
        }
    }

    // E-Mail-Feld im Formular ausfüllen
    function fillEmailField(email) {
        if (!email) return;
        
        // E-Mail-Feld im Formular suchen
        const emailField = document.querySelector('input[name="email"]') || 
                          document.querySelector('input[type="email"]');
        
        if (emailField) {
            // E-Mail-Wert setzen
            emailField.value = email;
            
            // Als readonly markieren
            emailField.setAttribute('readonly', 'readonly');
            
            // Visuelles Feedback
            emailField.style.backgroundColor = '#f0f9ff';
            emailField.style.borderColor = '#93c5fd';
            emailField.style.color = '#1e40af';
            
            console.log('✓ E-Mail-Feld erfolgreich ausgefüllt mit:', email);
            return true;
        } else {
            console.warn('⚠️ E-Mail-Feld nicht gefunden');
            return false;
        }
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

    // Einziger Calendly‑Event‑Listener mit API-Integration
    window.addEventListener('message', function(e) {
        if (e.data.event === 'calendly.event_scheduled') {
            console.log('✅ Termin gebucht – Debug-Infos:', e.data);
            
            // Status setzen
            calendlyBooked = true;
            localStorage.setItem('calendlyBooked', 'true');
            
            // Invitee-URI aus dem Payload extrahieren
            const payload = e.data.payload || {};
            const inviteeUri = payload.invitee ? payload.invitee.uri : null;
            
            if (inviteeUri) {
                console.log('✓ Invitee URI erhalten:', inviteeUri);
                localStorage.setItem('calendlyInviteeUri', inviteeUri);
                
                // Calendly API abfragen, um E-Mail zu bekommen
                fetchInviteeEmail(inviteeUri).then(email => {
                    console.log(email ? '✓ E-Mail-Adresse erfolgreich abgerufen' : '⚠️ Keine E-Mail-Adresse gefunden');
                });
            }

            // Formular anzeigen
            var form = document.getElementById('contact-form');
            var hint = document.getElementById('form-hint');
            if (form) {
                form.style.display = 'block';
                setTimeout(function(){ 
                    form.style.opacity = '1';
                    
                    // Nochmals versuchen, das E-Mail-Feld zu füllen, nachdem das Formular sichtbar ist
                    setTimeout(function() {
                        var storedEmail = localStorage.getItem('calendlyEmail');
                        if (storedEmail) {
                            fillEmailField(storedEmail);
                        }
                    }, 200);
                }, 50);
            }
            if (hint) {
                hint.style.display = 'none';
            }

            // Exit‑Intent aktivieren
            setupExitIntent();
        }
    });

})();
