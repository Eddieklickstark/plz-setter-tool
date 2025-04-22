(function() {
    var SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR8BRATZeyiaD0NMh00CWU1bJYZA2XRYA3jrd_XRLg-wWV9UEh9hD___JLuiFZT8nalLamjKMJyc3MJ/pub?gid=0&single=true&output=csv';
    var WEBHOOK_URL = 'https://hook.eu2.make.com/t9xvbefzv5i8sjcr7u8tiyvau7t1wnlw';
    var aeMapping = {};
    var bundeslaender = [];

    // Variablen zur Nachverfolgung des Buchungsstatus
    var calendlyBooked = false;
    var formSubmitted = false;
    var exitIntentShown = false;

    // WICHTIG: Bei jedem Seitenaufruf den Status zurücksetzen
    localStorage.removeItem('calendlyBooked');
    localStorage.removeItem('formSubmitted');
    localStorage.removeItem('exitIntentShown');

    // Anzahl maximaler Versuche für POST-Request
    var MAX_RETRIES = 3;

    function addStyles() {
        var css = document.createElement('style');
        css.type = 'text/css';
        css.innerHTML = [
            /* Container */
            '.setter-tool-test { max-width: 800px; margin: 0 auto; padding: 2rem; border-radius: 2rem; font-family: figtree, sans-serif; }',

            /* Überschriften */
            '.section-header { font-size: 22px; color: #111827; margin-bottom: 16px; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB; }',
            '.subsection-header { font-size: 18px; color: #374151; margin: 16px 0; font-weight: 500; }',

            /* Bundesland-Bereich */
            '.bundesland-section { margin-bottom: 40px; }',
            '.bundesland-input-container { position: relative; margin-bottom: 20px; }',

            /* Input Styles */
            '.ios-input { width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 10px; font-size: 16px; background: #FAFAFA; }',
            '.ios-input:focus { outline: none; border-color: #046C4E; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(4, 108, 78, 0.1); }',
            '.ios-input[readonly] { background-color: #f0f9ff; border-color: #93c5fd; color: #1e40af; }',

            /* Calendly Placeholder & Container */
            '.calendly-placeholder { background: #F9FAFB; border: 2px dashed #E5E7EB; border-radius: 12px; padding: 40px; text-align: center; color: #6B7280; min-height: 400px; display: flex; align-items: center; justify-content: center; }',
            '#calendly-container { margin: 20px 0; border-radius: 12px; overflow: hidden; background: white; min-height: 400px; }',

            /* Formular */
            '.form-section { margin-top: 40px; }',
            '.form-group { margin-bottom: 32px; }',
            '.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }',
            '@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }',
            '.ios-textarea { min-height: 120px; resize: vertical; width: 100%; }',

            /* Button */
            '.ios-submit { background: #046C4E; color: white; padding: 16px 32px; border: none; border-radius: 10px; font-size: 16px; cursor: pointer; width: 100%; margin-top: 24px; transition: all 0.3s ease; }',
            '.ios-submit:hover { background: #065F46; }',
            '.ios-submit:disabled { background: #ccc; cursor: not-allowed; }',

            /* AE-Info */
            '.ae-info { background: #f7fafc; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; font-size: 18px; }',

            /* Erfolgsmeldung */
            '.success-message { background-color: #28a745; color: #fff; text-align: center; border-radius: 12px; padding: 15px; margin-top: 10px; display: none; }',
            '.success-message p { margin: 0; font-family: figtree, sans-serif; }',
            '.success-message p:first-child { font-size: 20px; margin-bottom: 8px; }',
            '.success-message p:last-child { font-size: 14px; }',
            '.show { display: block !important; }',

            /* Overlay für Ladeanimation */
            '.overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: none; align-items: center; justify-content: center; z-index: 9999; }',
            '.overlay.show { display: flex; }',
            '.spinner { width: 50px; height: 50px; border: 6px solid #f3f3f3; border-top: 6px solid #046C4E; border-radius: 50%; animation: spin 1s linear infinite; }',
            '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }',

            /* Exit Intent Styling */
            '.exit-intent-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; }',
            '.exit-intent-dialog { max-width: 500px; width: 90%; background-color: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); padding: 30px; position: relative; font-family: figtree, sans-serif; }',
            '.exit-intent-close { position: absolute; top: 15px; right: 15px; font-size: 24px; line-height: 1; cursor: pointer; color: #6B7280; }',
            '.exit-intent-title { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 16px; }',
            '.exit-intent-message { font-size: 16px; color: #4B5563; margin-bottom: 24px; line-height: 1.6; }',
            '.exit-intent-buttons { display: flex; gap: 12px; justify-content: flex-end; }',
            '.exit-intent-button-primary { background-color: #046C4E; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 500; border: none; cursor: pointer; transition: background-color 0.2s; }',
            '.exit-intent-button-primary:hover { background-color: #065F46; }',
            '.exit-intent-button-secondary { background-color: #F3F4F6; color: #374151; padding: 12px 20px; border-radius: 8px; font-weight: 500; border: none; cursor: pointer; transition: background-color 0.2s; }',
            '.exit-intent-button-secondary:hover { background-color: #E5E7EB; }',
            
            /* WICHTIG: Formular initial ausblenden */
            '#contact-form { display: none; opacity: 0; transition: opacity 0.3s ease; }'
        ].join('\n');
        document.head.appendChild(css);
    }

    function createStructure() {
        var container = document.querySelector('.setter-tool-test');
        if (!container) return;

        var html =
        `<div class="bundesland-section">
            <h2 class="section-header">Terminbuchung</h2>
            <h3 class="subsection-header">Schritt 1 - Calendly Termin buchen</h3>
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

        <h3 class="subsection-header">Schritt 2 - Daten eintragen</h3>
        <p id="form-hint" style="background: #fff8db; border: 1px solid #fcd34d; padding: 12px; border-radius: 8px; color: #92400e; font-size: 14px; margin-bottom: 24px;">
        Das Formular wird sichtbar, sobald ein Termin über Calendly gebucht wurde.
        </p>
        <form id="contact-form" class="form-section">
            <h2 class="section-header">Kontaktinformationen</h2>
            <input type="hidden" id="bundesland-hidden" name="bundesland" value="">

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

            <div class="form-group">
                <h3 class="subsection-header">Standortinformationen</h3>
                <div class="form-grid">
                    <input type="text" class="ios-input required" name="strasse" placeholder="Standort Straße*" required>
                    <input type="text" class="ios-input required" name="hausnummer" placeholder="Standort Hausnummer*" required>
                    <input type="text" class="ios-input required" name="plz" placeholder="Standort Postleitzahl*" required>
                    <input type="text" class="ios-input required" name="stadt" placeholder="Standort Stadt*" required>
                </div>
            </div>

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
                    <input type="tel" class="ios-input required" name="festnetz" placeholder="Festnetznummer* - Nur Zahlen!" required>
                    <input type="tel" class="ios-input" name="mobil" placeholder="Mobil - Nur Zahlen!">
                    <input type="url" class="ios-input" name="linkedin" placeholder="LinkedIn Profil: https://www.linkedin.com/in/beispiel" style="grid-column: span 2;">
                </div>
            </div>

            <div class="form-group">
               <h3 class="subsection-header">Gesprächsnotiz*</h3>
               <textarea class="ios-input ios-textarea required" name="gespraechsnotiz"
                   placeholder="Gesprächsnotiz - Bitte ausführlich den Verlauf des Telefonats protokollieren (mind. 3 Sätze/Zeilen). Jede zusätzliche Information hilft unseren Kollegen im Termin.*" required></textarea>
            </div>

            <button type="submit" class="ios-submit">Informationen senden</button>

            <!-- Erfolgsmeldung -->
            <div class="success-message" id="success-message">
                <p>Daten wurden erfolgreich gespeichert!</p>
                <p>Die Seite wird jetzt neu geladen</p>
            </div>
        </form>

        <!-- Overlay + Spinner für Lade-Animation -->
        <div class="overlay" id="loading-overlay">
            <div class="spinner"></div>
        </div>
        `;
        container.innerHTML = html;
        
        // WICHTIG: Nochmal explizit das Formular ausblenden
        const form = document.getElementById('contact-form');
        if (form) {
            console.log('📋 Formular initial ausgeblendet');
            form.style.display = 'none';
            form.style.opacity = '0';
        }
    }

    function updateBundeslandSelect() {
        var select = document.getElementById('bundesland-select');
        if (!select) return;
        select.innerHTML = '<option value="">Bundesland wählen...</option>';
        bundeslaender.forEach(function(bundesland) {
            select.innerHTML += '<option value="' + bundesland + '">' + bundesland + '</option>';
        });
    }

    function loadAEData() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', SHEET_URL, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                Papa.parse(xhr.responseText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        aeMapping = {};
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

    function updateUI(ae, bundesland) {
        var resultDiv = document.getElementById('ae-result');
        var calendlyDiv = document.getElementById('calendly-container');
        if (!resultDiv || !calendlyDiv) return;

        if (ae) {
            resultDiv.innerHTML = '<div class="ae-info">' +
                '<div class="ae-title"><p>Zuständiger Account Executive für ' + bundesland + '</p></div>' +
                '<div class="ae-details"><p><strong>Name:</strong> ' + ae.name + '</p></div>' +
            '</div>';

            if (ae.calendlyLink) {
                calendlyDiv.innerHTML = '<div class="calendly-inline-widget" ' +
                    'data-url="' + ae.calendlyLink + '?hide_gdpr_banner=1&hide_event_type_details=1&hide_landing_page_details=1&background_color=ffffff&hide_title=1" ' +
                    'style="min-width:320px;height:700px;">' +
                    '</div>';

                if (window.Calendly) {
                    window.Calendly.initInlineWidget({
                        url: ae.calendlyLink + '?hide_gdpr_banner=1&hide_event_type_details=1&hide_landing_page_details=1&background_color=ffffff&hide_title=1',
                        parentElement: calendlyDiv.querySelector('.calendly-inline-widget')
                    });
                }
            } else {
                // Falls kein Calendly-Link vorhanden
                calendlyDiv.innerHTML = '<div class="calendly-placeholder">Kein Kalenderlink verfügbar.</div>';
            }
        } else {
            calendlyDiv.innerHTML = '<div class="calendly-placeholder">Bitte wählen Sie zuerst ein Bundesland aus, um den Kalender zu laden.</div>';
        }
    }

    /**
     * Sendet die Formulardaten per POST an den Webhook. Falls der Request fehlschlägt,
     * wird er bis zu max. MAX_RETRIES mal wiederholt.
     * @param {Object} data - die zu sendenden Formulardaten
     * @param {number} attempt - aktueller Versuchszähler
     */
    async function sendFormData(data, attempt = 1) {
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                return true; // Erfolg
            } else {
                throw new Error('Nicht ok: ' + response.statusText);
            }
        } catch (error) {
            console.error('Fehler beim Senden (Versuch ' + attempt + '):', error);

            if (attempt < MAX_RETRIES) {
                // Kurz warten und dann erneut versuchen
                await new Promise(res => setTimeout(res, 1500));
                return sendFormData(data, attempt + 1);
            } else {
                // Zu viele Fehlversuche
                return false;
            }
        }
    }

    // Overlay-Animation aktivieren/deaktivieren
    function showLoadingOverlay() {
        var overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }
    function hideLoadingOverlay() {
        var overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    // Prüfen, ob Exit Intent Dialog angezeigt werden soll
    function checkShowExitIntent(isBeforeUnload = false) {
        // Nur anzeigen wenn:
        // 1. Calendly gebucht wurde
        // 2. Formular noch nicht abgesendet wurde
        // 3. Exit Intent noch nicht angezeigt wurde oder wir sind bei beforeunload
        if (calendlyBooked && !formSubmitted && (!exitIntentShown || isBeforeUnload)) {
            if (!isBeforeUnload) {
                // Nur bei mouseleave den Dialog anzeigen (nicht bei beforeunload)
                showExitIntentDialog();
                // Als angezeigt markieren
                exitIntentShown = true;
                localStorage.setItem('exitIntentShown', 'true');
            }
            return true;
        }
        return false;
    }

    // Exit Intent Dialog anzeigen
    function showExitIntentDialog() {
        console.log('⚠️ Exit Intent Dialog wird angezeigt');
        
        // Dialog erstellen
        var dialogHTML = `
            <div class="exit-intent-overlay" id="exit-intent-overlay">
                <div class="exit-intent-dialog">
                    <div class="exit-intent-close" id="exit-intent-close">&times;</div>
                    <div class="exit-intent-title">Moment noch!</div>
                    <div class="exit-intent-message">
                        <p>Sie haben bereits einen Termin gebucht, aber das Formular für weitere Informationen noch nicht abgesendet.</p>
                        <p>Ihre Zusatzinformationen helfen uns, Ihr Anliegen optimal vorzubereiten.</p>
                    </div>
                    <div class="exit-intent-buttons">
                        <button class="exit-intent-button-secondary" id="exit-intent-leave">Trotzdem verlassen</button>
                        <button class="exit-intent-button-primary" id="exit-intent-complete">Formular ausfüllen</button>
                    </div>
                </div>
            </div>
        `;
        
        // Dialog ins DOM einfügen
        var dialogContainer = document.createElement('div');
        dialogContainer.innerHTML = dialogHTML;
        document.body.appendChild(dialogContainer.firstElementChild);
        
        // Event-Handler für Dialog-Buttons
        document.getElementById('exit-intent-close').addEventListener('click', closeExitIntentDialog);
        document.getElementById('exit-intent-leave').addEventListener('click', function() {
            // Dem Nutzer erlauben, die Seite zu verlassen ohne weitere Warnung
            localStorage.removeItem('calendlyBooked');
            closeExitIntentDialog();
        });
        
        document.getElementById('exit-intent-complete').addEventListener('click', function() {
            closeExitIntentDialog();
            // Zum Formular scrollen
            var form = document.getElementById('contact-form');
            if (form) {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Exit Intent Dialog schließen
    function closeExitIntentDialog() {
        var overlay = document.getElementById('exit-intent-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Exit Intent Tracking einrichten
    function setupExitIntent() {
        console.log('🔍 Exit Intent Tracking aktiviert');
        
        // Exit Intent Erkennung: Mausbewegung nach oben/außerhalb
        document.addEventListener('mouseleave', function(e) {
            if (e.clientY <= 5) { // Wenn Maus den oberen Bereich verlässt
                checkShowExitIntent();
            }
        });
        
        // beforeunload Event für Browser-Schließen oder Seite verlassen
        window.addEventListener('beforeunload', function(e) {
            if (checkShowExitIntent(true)) {
                // Standard-Dialog anzeigen
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    }

    function init() {
        addStyles();
        createStructure();
        loadAEData();
        
        // NOCHMAL EXPLIZIT SICHERSTELLEN, dass das Formular ausgeblendet ist
        setTimeout(function() {
            var form = document.getElementById('contact-form');
            if (form) {
                form.style.display = 'none';
                form.style.opacity = '0';
            }
        }, 100);

        var bundeslandSelect = document.getElementById('bundesland-select');
        if (bundeslandSelect) {
            bundeslandSelect.addEventListener('change', function() {
                var selectedBundesland = this.value;
                document.getElementById('bundesland-hidden').value = selectedBundesland;
                if (selectedBundesland) {
                    updateUI(aeMapping[selectedBundesland], selectedBundesland);
                }
            });
        }

        var form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();

                // Status auf "abgesendet" setzen
                formSubmitted = true;
                localStorage.setItem('formSubmitted', 'true');

                // Submit-Button deaktivieren
                var submitBtn = form.querySelector('.ios-submit');
                if (submitBtn) {
                    submitBtn.disabled = true;
                }

                // Lade-Overlay anzeigen
                showLoadingOverlay();

                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);

                console.log('Sende Daten an Make:', data);

                const success = await sendFormData(data);

                // Lade-Overlay ausblenden
                hideLoadingOverlay();

                if (success) {
                    var successMsg = document.getElementById('success-message');
                    if (successMsg) {
                        successMsg.classList.add('show');
                    }

                    // 2 Sekunden warten, Meldung entfernen, dann reload
                    setTimeout(function() {
                        if (successMsg) {
                            successMsg.classList.remove('show');
                        }
                        // 1 Sek. warten, dann reload
                        setTimeout(function() {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            window.location.reload();
                        }, 1000);
                    }, 2000);
                } else {
                    console.error('Alle Versuche sind fehlgeschlagen.');
                    alert('Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut oder deaktivieren Sie ggf. Browser-Plugins (Adblock etc.).');
                    
                    // Button wieder aktivieren
                    if (submitBtn) {
                        submitBtn.disabled = false;
                    }
                }
            });
        }
    }

    function loadDependencies() {
        var papaScript = document.createElement('script');
        papaScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js';
        papaScript.onload = function() {
            var calendlyScript = document.createElement('script');
            calendlyScript.src = 'https://assets.calendly.com/assets/external/widget.js';
            calendlyScript.async = true;
            calendlyScript.onload = init;
            document.head.appendChild(calendlyScript);
        };
        document.head.appendChild(papaScript);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDependencies);
    } else {
        loadDependencies();
    }
    
    // Der einzige Event-Listener für Calendly-Events
// Ersetzen Sie den Calendly Event-Listener mit diesem einfacheren Code:

    window.addEventListener('message', function(e) {
        if (e.data.event && e.data.event === 'calendly.event_scheduled') {
            console.log('✅ Termin gebucht – Debugging-Informationen:');
            
            // Status auf "gebucht" setzen
            calendlyBooked = true;
            
            try {
                // Manuelle E-Mail-Extraktion mit detaillierter Fehlerbehandlung
                console.log('📦 Vollständige Event-Daten:', e.data);
                
                var emailFound = false;
                var emailValue = null;
                
                // Versuch 1: Direkte Extraktion
                if (e.data.payload && e.data.payload.invitee && e.data.payload.invitee.email) {
                    emailValue = e.data.payload.invitee.email;
                    emailFound = true;
                    console.log('✓ E-Mail in payload.invitee.email gefunden:', emailValue);
                } else {
                    console.log('✗ E-Mail nicht in payload.invitee.email gefunden');
                }
                
                // Versuch 2: Extraktion aus event
                if (!emailFound && e.data.payload && e.data.payload.event && e.data.payload.event.email) {
                    emailValue = e.data.payload.event.email;
                    emailFound = true;
                    console.log('✓ E-Mail in payload.event.email gefunden:', emailValue);
                } else {
                    console.log('✗ E-Mail nicht in payload.event.email gefunden');
                }
                
                // Versuch 3: Manuelle Suche in der gesamten Payload
                if (!emailFound) {
                    console.log('⚠️ Versuche manuelle Suche in der Payload nach E-Mail');
                    
                    // Funktion zum rekursiven Durchsuchen des Objekts nach E-Mail-Eigenschaften
                    function findEmailInObject(obj, path = '') {
                        if (!obj || typeof obj !== 'object') return;
                        
                        for (var key in obj) {
                            var currentPath = path ? path + '.' + key : key;
                            
                            // Prüfen, ob der Eigenschaftsname "email" enthält
                            if (key.toLowerCase().includes('email')) {
                                console.log('✓ Mögliche E-Mail-Eigenschaft gefunden:', currentPath, obj[key]);
                                
                                // Prüfen, ob der Wert wie eine E-Mail aussieht
                                if (typeof obj[key] === 'string' && obj[key].includes('@')) {
                                    emailValue = obj[key];
                                    emailFound = true;
                                    console.log('✓ E-Mail-Wert gefunden in:', currentPath, emailValue);
                                    return true;
                                }
                            }
                            
                            // Rekursiv in verschachtelten Objekten suchen
                            if (typeof obj[key] === 'object' && obj[key] !== null) {
                                if (findEmailInObject(obj[key], currentPath)) {
                                    return true;
                                }
                            }
                        }
                        
                        return false;
                    }
                    
                    findEmailInObject(e.data);
                }
                
                // Ausgabe ob E-Mail gefunden wurde
                if (emailFound) {
                    console.log('📧 E-Mail erfolgreich extrahiert:', emailValue);
                } else {
                    // Wenn keine E-Mail gefunden wurde, verwenden wir eine Test-E-Mail
                    emailValue = 'test@example.com';
                    console.log('⚠️ Keine E-Mail gefunden, verwende Test-E-Mail:', emailValue);
                }
                
                // E-Mail in das Formular übertragen
                console.log('🔄 Versuche E-Mail ins Formular zu übertragen...');
                
                // Formular anzeigen
                var form = document.getElementById('contact-form');
                var hint = document.getElementById('form-hint');
                
                if (form) {
                    console.log('✓ Formular gefunden, wird angezeigt');
                    form.style.display = 'block';
                    
                    // Warten, bis das Formular sichtbar ist
                    setTimeout(function() {
                        form.style.opacity = '1';
                        console.log('✓ Formular ist jetzt sichtbar');
                        
                        // Jetzt können wir das E-Mail-Feld suchen und füllen
                        setTimeout(function() {
                            // Versuchen, das E-Mail-Feld zu finden
                            var emailField = null;
                            
                            // Methode 1: Nach name-Attribut suchen
                            emailField = document.querySelector('input[name="email"]');
                            if (emailField) {
                                console.log('✓ E-Mail-Feld gefunden mit input[name="email"]');
                            } else {
                                console.log('✗ E-Mail-Feld nicht gefunden mit input[name="email"]');
                                
                                // Methode 2: Nach Typ suchen
                                emailField = document.querySelector('input[type="email"]');
                                if (emailField) {
                                    console.log('✓ E-Mail-Feld gefunden mit input[type="email"]');
                                } else {
                                    console.log('✗ E-Mail-Feld nicht gefunden mit input[type="email"]');
                                    
                                    // Methode 3: Nach Platzhalter suchen
                                    emailField = document.querySelector('input[placeholder*="E-Mail"]');
                                    if (emailField) {
                                        console.log('✓ E-Mail-Feld gefunden mit input[placeholder*="E-Mail"]');
                                    } else {
                                        console.log('✗ E-Mail-Feld nicht gefunden mit input[placeholder*="E-Mail"]');
                                        
                                        // Alle Inputs auflisten für Debug
                                        var allInputs = form.querySelectorAll('input');
                                        console.log('⚠️ Alle Input-Felder im Formular:', allInputs.length);
                                        allInputs.forEach(function(input, index) {
                                            console.log('Input #' + index + ':', input.name, input.type, input.placeholder);
                                        });
                                    }
                                }
                            }
                            
                            // Wenn das E-Mail-Feld gefunden wurde
                            if (emailField) {
                                // Direktes Setzen des Werts
                                emailField.value = emailValue;
                                console.log('✓ E-Mail-Wert gesetzt auf:', emailField.value);
                                
                                // E-Mail-Feld als readonly markieren
                                emailField.setAttribute('readonly', 'readonly');
                                console.log('✓ E-Mail-Feld auf readonly gesetzt');
                                
                                // Visuelles Feedback
                                emailField.style.backgroundColor = '#f0f9ff';
                                emailField.style.borderColor = '#93c5fd';
                                emailField.style.color = '#1e40af';
                                console.log('✓ E-Mail-Feld-Styling angewendet');
                                
                                // Alternative Methoden, falls normale Zuweisung nicht klappt
                                setTimeout(function() {
                                    if (!emailField.value) {
                                        console.log('⚠️ E-Mail-Feld ist immer noch leer, versuche alternative Methoden');
                                        
                                        // Methode 1: Ereignis auslösen
                                        var event = new Event('input', { bubbles: true });
                                        emailField.value = emailValue;
                                        emailField.dispatchEvent(event);
                                        console.log('✓ Input-Event ausgelöst');
                                        
                                        // Methode 2: Value direkt im DOM setzen
                                        if (!emailField.value) {
                                            console.log('⚠️ E-Mail-Feld immer noch leer, versuche DOM-Manipulation');
                                            
                                            // Direkte DOM-Manipulation
                                            emailField.value = emailValue;
                                            
                                            // Sicherstellen, dass readonly gesetzt ist
                                            emailField.setAttribute('readonly', 'readonly');
                                            emailField.readOnly = true;
                                            
                                            // Nochmals Styling anwenden
                                            emailField.style.backgroundColor = '#f0f9ff';
                                            emailField.style.borderColor = '#93c5fd';
                                            emailField.style.color = '#1e40af';
                                        }
                                    }
                                }, 500);
                            }
                        }, 200);
                    }, 100);
                } else {
                    console.log('✗ Formular nicht gefunden');
                }
                
                if (hint) {
                    hint.style.display = 'none';
                    console.log('✓ Hinweis ausgeblendet');
                }
                
                // Exit Intent Tracking einrichten
                setupExitIntent();
                
            } catch (error) {
                console.error('❌ Fehler beim Verarbeiten des Calendly-Events:', error);
                
                // Sicherstellen, dass das Formular trotzdem angezeigt wird
                var form = document.getElementById('contact-form');
                var hint = document.getElementById('form-hint');
                
                if (form) {
                    form.style.display = 'block';
                    form.style.opacity = '1';
                }
                
                if (hint) {
                    hint.style.display = 'none';
                }
                
                // Exit Intent Tracking trotzdem einrichten
                setupExitIntent();
            }
        }
    });
})();
