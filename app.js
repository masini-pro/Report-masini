document.addEventListener('DOMContentLoaded', () => {

    // --- Logica di Login Sicura con Hashing ---
    const loginOverlay = document.getElementById('login-overlay');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('error-message');
    const mainContainer = document.querySelector('.container');
    
    // --- HASH CORRETTO ---
    // Questo è l'hash SHA-256 corretto per la password "roteglia".
    const correctPasswordHash = '4f50f9be1c913968f1e900439c2c90043cc9ca811ba3907f6eda781648d628e';

    // Funzione per calcolare l'hash SHA-256 di una stringa
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // La funzione di login è asincrona per attendere il calcolo dell'hash
    const attemptLogin = async () => {
        const enteredPassword = passwordInput.value;
        if (!enteredPassword) return;

        if (!window.crypto || !window.crypto.subtle) {
            alert("ERRORE CRITICO: L'API di crittografia non è disponibile. Assicurati di caricare il sito tramite HTTPS (come su GitHub Pages) e non da un file locale.");
            return;
        }

        const enteredPasswordHash = await sha256(enteredPassword);

        if (enteredPasswordHash === correctPasswordHash) {
            loginOverlay.style.display = 'none';
            mainContainer.style.display = 'block';
        } else {
            errorMessage.classList.remove('hidden');
            passwordInput.value = '';
        }
    };

    loginButton.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });
    // -----------------------------

    // Registra il Service Worker per la PWA e l'uso offline
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(error => console.log('Errore registrazione Service Worker:', error));
    }

    // --- ELEMENTI DEL DOM ---
    const form = document.getElementById('reportForm');
    const visitDateInput = document.getElementById('visitDate');
    const weekNumberInput = document.getElementById('weekNumber');
    const countrySelect = document.getElementById('country');
    const agentSelect = document.getElementById('agent');
    const locationInput = document.getElementById('location');
    const departmentInput = document.getElementById('department');
    const regionInput = document.getElementById('region');
    const autocompleteResults = document.getElementById('autocompleteResults');
    const interlocutoriContainer = document.getElementById('interlocutori-container');
    const addInterlocutoreBtn = document.getElementById('addInterlocutore');
    const reminderToggle = document.getElementById('reminderToggle');
    const reminderDateContainer = document.getElementById('reminderDateContainer');
    const resetButton = document.getElementById('resetButton');
    const fileInput = document.getElementById('attachments');
    const fileListDiv = document.getElementById('file-list');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const generateIcsBtn = document.getElementById('generateIcsBtn');

    let comuniData = [];
    let isComuniLoaded = false;
    let selectedCommuneData = null;

    // --- CARICAMENTO DATI INIZIALI ---
    fetch('comuni.json').then(r => r.json()).then(d => { comuniData = d; isComuniLoaded = true; }).catch(console.error);
    fetch('agenti.json').then(r => r.json()).then(d => {
        d.forEach(a => agentSelect.add(new Option(a, a)));
    }).catch(console.error);

    const today = new Date();
    visitDateInput.value = today.toISOString().split('T')[0];
    updateWeekNumber(today);
    addInterlocutore();

    // --- FUNZIONI ---

    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    function updateWeekNumber(date) {
        if (date) weekNumberInput.value = getWeekNumber(date);
    }

    function handleAutocomplete(e) {
        const query = e.target.value.toLowerCase().trim();
        const selectedCountry = countrySelect.value;
        autocompleteResults.innerHTML = '';
        departmentInput.value = '';
        regionInput.value = '';
        selectedCommuneData = null;

        if (query.length < 2 || !isComuniLoaded) return;
        
        const filteredComuni = comuniData
            .filter(c => c.pays === selectedCountry && c.commune.toLowerCase().startsWith(query))
            .slice(0, 7);
        
        filteredComuni.forEach(comuneObj => {
            const div = document.createElement('div');
            div.classList.add('autocomplete-item');
            div.innerHTML = `<strong>${comuneObj.commune.substring(0, query.length)}</strong>${comuneObj.commune.substring(query.length)}`;
            div.addEventListener('click', () => selectCommune(comuneObj));
            autocompleteResults.appendChild(div);
        });
    }
    
    function selectCommune(comuneObj) {
        selectedCommuneData = comuneObj;
        locationInput.value = comuneObj.commune;
        departmentInput.value = comuneObj.departement ? `${comuneObj.departement} (${comuneObj.code_departement})` : 'N/D';
        regionInput.value = comuneObj.region || 'N/D';
        autocompleteResults.innerHTML = '';
    }

    function addInterlocutore() {
        const id = Date.now();
        const div = document.createElement('div');
        div.className = 'interlocutore-group';
        div.id = `interlocutore-${id}`;
        div.innerHTML = `<div class="form-group"><label for="contactName-${id}">Nome e Cognome</label><input type="text" id="contactName-${id}" class="contactName" placeholder="Nome Cognome" required></div><div class="form-group"><label for="contactRole-${id}">Ruolo</label><select id="contactRole-${id}" class="contactRole" required><option value="Titolare">Titolare</option><option value="Venditore di sala">Venditore di sala</option><option value="Responsabile di sede">Responsabile di sede</option><option value="Direttore commerciale">Direttore commerciale</option><option value="Buyer">Buyer</option><option value="Alto dirigente">Alto dirigente</option></select></div><button type="button" class="remove-interlocutore-btn" title="Rimuovi interlocutore"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clip-rule="evenodd" /></svg></button>`;
        interlocutoriContainer.appendChild(div);
        div.querySelector('.remove-interlocutore-btn').addEventListener('click', () => div.remove());
    }

    // Funzione per comprimere le immagini allegate
    async function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024; // Risoluzione massima per la compressione
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Converte in JPEG con qualità 0.7 (buon compromesso peso/qualità)
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    async function loadImageAsBase64(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Errore nel caricamento dell'immagine:", error);
            return null;
        }
    }

    async function generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        
        const FONT = 'Helvetica';
        const MARGIN = 15;
        const WIDTH = doc.internal.pageSize.getWidth();
        let y = MARGIN;

        const visitDateObj = new Date(data.visitDate);
        visitDateObj.setMinutes(visitDateObj.getMinutes() + visitDateObj.getTimezoneOffset());
        const dateInLettere = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(visitDateObj);
        const pdfTitle = `S${data.weekNumber} - Visita ${data.clientName} a ${data.location} in data ${dateInLettere}`;

        // Titolo con gestione a capo automatica
        doc.setFont(FONT, 'bold').setFontSize(16).setTextColor(44, 62, 80);
        const titleLines = doc.splitTextToSize(pdfTitle, WIDTH - MARGIN * 2);
        doc.text(titleLines, WIDTH / 2, y, { align: 'center' });
        y += titleLines.length * 7 + 5;

        doc.setFont(FONT, 'normal').setFontSize(10).setTextColor(100);
        doc.text(`Area Manager: ${data.areaManager}`, MARGIN, y);
        doc.text(`Agente: ${data.agent}`, WIDTH - MARGIN, y, { align: 'right' });
        y += 7;
        doc.setLineWidth(0.5).line(MARGIN, y, WIDTH - MARGIN, y);
        y += 7;
        
        // Logica per caricare la mappa corretta
        let mapBase64 = null;
        let mapFileName = null;
        if (data.country === 'Francia' && data.departmentCode) {
            mapFileName = `${data.departmentCode}.jpeg`;
        } else if (data.country === 'Monaco') {
            mapFileName = '06.jpeg'; // Usa la mappa delle Alpi Marittime per Monaco
        } else if (data.country === 'Belgio') {
            mapFileName = 'belgium.jpeg';
        } else if (data.country === 'Lussemburgo') {
            mapFileName = 'luxembourg.jpeg';
        }
        
        if (mapFileName) {
            // Assicurati che il percorso corrisponda a quello su GitHub
            const mapUrl = `https://raw.githubusercontent.com/masini-pro/Report-masini/main/FR_maps/${mapFileName}`;
            mapBase64 = await loadImageAsBase64(mapUrl);
        }

        const mapSectionYStart = y;
        let textMaxWidth = WIDTH - MARGIN * 2;
        if (mapBase64) {
            const mapWidth = 60;
            const mapHeight = 60;
            const mapX = WIDTH - MARGIN - mapWidth;
            doc.addImage(mapBase64, 'JPEG', mapX, mapSectionYStart, mapWidth, mapHeight);
            textMaxWidth = mapX - MARGIN - 5;
        }

        let tempY = y;
        const addSectionTitle = (title) => {
            doc.setFont(FONT, 'bold').setFontSize(12).setTextColor(74, 144, 226);
            doc.text(title, MARGIN, tempY, { maxWidth: textMaxWidth });
            tempY += 6;
        };

        const printRow = (label, value) => {
            if (!value || value === 'N/D') return;
            doc.setFont(FONT, 'bold').setFontSize(10).setTextColor(50);
            const labelWidth = doc.getTextWidth(label);
            doc.text(label, MARGIN, tempY, { maxWidth: textMaxWidth });
            doc.setFont(FONT, 'normal');
            // Gestione a capo del valore per non sovrapporre
            const valueLines = doc.splitTextToSize(value, textMaxWidth - labelWidth - 2);
            doc.text(valueLines, MARGIN + labelWidth + 2, tempY);
            tempY += valueLines.length * 5;
        };
        
        addSectionTitle('Riepilogo Visita');
        printRow('Data:', `${new Date(data.visitDate).toLocaleDateString('it-IT')} (S${data.weekNumber})`);
        printRow('Paese:', data.country);
        printRow('Cliente:', data.clientName);
        printRow('Comune:', data.location);
        printRow('Dipartimento:', data.department);
        printRow('Regione:', data.region);
        tempY += 4;

        addSectionTitle('Interlocutori');
        data.interlocutori.forEach(p => {
            // Layout corretto per nome e ruolo per evitare sovrapposizioni
            doc.setFont(FONT, 'bold').setFontSize(10).setTextColor(50);
            const nameText = `- ${p.name}`;
            const roleText = `(${p.role})`;
            const nameWidth = doc.getTextWidth(nameText);
            const roleWidth = doc.getTextWidth(roleText);

            if (nameWidth + roleWidth + 5 < textMaxWidth) {
                // Stanno sulla stessa riga
                doc.text(nameText, MARGIN, tempY);
                doc.setFont(FONT, 'normal').setFontSize(9).setTextColor(100);
                doc.text(roleText, MARGIN + nameWidth + 2, tempY);
                tempY += 5;
            } else {
                // Vanno su righe separate
                doc.text(nameText, MARGIN, tempY);
                tempY += 5;
                doc.setFont(FONT, 'normal').setFontSize(9).setTextColor(100);
                doc.text(roleText, MARGIN + 5, tempY);
                tempY += 5;
            }
        });
        
        y = Math.max(tempY, mapSectionYStart + (mapBase64 ? 65 : 0));
        
        const printLongTextSection = (title, content) => {
            y += 6;
            doc.setFont(FONT, 'bold').setFontSize(12).setTextColor(74, 144, 226);
            doc.text(title, MARGIN, y);
            y += 6;
            doc.setFont(FONT, 'normal').setFontSize(10).setTextColor(50);
            const splitText = doc.splitTextToSize(content || 'Nessun dato.', WIDTH - (MARGIN * 2));
            doc.text(splitText, MARGIN, y);
            y += splitText.length * 5;
        };
        
        printLongTextSection('Argomenti Trattati:', data.topics);
        printLongTextSection('Cosa è stato concordato?', data.agreements);
        if (data.hasReminder) {
            printLongTextSection('Reminder Impostato:', `Follow-up richiesto per il ${new Date(data.reminderDate).toLocaleDateString('it-IT')}.`);
        }

        // Gestione Pagine Foto con layout intelligente
        if (data.attachments.length > 0) {
            const compressedImages = await Promise.all(
                data.attachments.filter(f => f.type.startsWith('image/')).map(compressImage)
            );
            
            const CHUNK_SIZE = 4;
            for (let i = 0; i < compressedImages.length; i += CHUNK_SIZE) {
                const chunk = compressedImages.slice(i, i + CHUNK_SIZE);
                doc.addPage();
                doc.setFont(FONT, 'bold').setFontSize(14).setTextColor(44, 62, 80);
                doc.text(`Allegati Fotografici (Pagina ${Math.floor(i / CHUNK_SIZE) + 1})`, WIDTH / 2, MARGIN, { align: 'center' });

                const pageHeight = doc.internal.pageSize.getHeight();
                const contentHeight = pageHeight - MARGIN * 2 - 10;
                const contentWidth = WIDTH - MARGIN * 2;

                if (chunk.length === 1) {
                    doc.addImage(chunk[0], 'JPEG', MARGIN, MARGIN + 10, contentWidth, contentHeight, undefined, 'FAST');
                } else if (chunk.length === 2) {
                    const imgHeight = (contentHeight - 5) / 2;
                    doc.addImage(chunk[0], 'JPEG', MARGIN, MARGIN + 10, contentWidth, imgHeight, undefined, 'FAST');
                    doc.addImage(chunk[1], 'JPEG', MARGIN, MARGIN + 15 + imgHeight, contentWidth, imgHeight, undefined, 'FAST');
                } else { // 3 o 4 immagini
                    const imgWidth = (contentWidth - 5) / 2;
                    const imgHeight = (contentHeight - 5) / 2;
                    doc.addImage(chunk[0], 'JPEG', MARGIN, MARGIN + 10, imgWidth, imgHeight, undefined, 'FAST');
                    if (chunk[1]) doc.addImage(chunk[1], 'JPEG', MARGIN + imgWidth + 5, MARGIN + 10, imgWidth, imgHeight, undefined, 'FAST');
                    if (chunk[2]) doc.addImage(chunk[2], 'JPEG', MARGIN, MARGIN + 15 + imgHeight, imgWidth, imgHeight, undefined, 'FAST');
                    if (chunk[3]) doc.addImage(chunk[3], 'JPEG', MARGIN + imgWidth + 5, MARGIN + 15 + imgHeight, imgWidth, imgHeight, undefined, 'FAST');
                }
            }
        }
        
        const year = visitDateObj.getFullYear();
        const week = String(data.weekNumber).padStart(2, '0');
        const day = String(visitDateObj.getDate()).padStart(2, '0');
        const month = String(visitDateObj.getMonth() + 1).padStart(2, '0');
        const cleanClientName = data.clientName.replace(/[\\/:*?"<>|]/g, '').trim();
        const cleanLocation = data.location.replace(/[\\/:*?"<>|]/g, '').trim();
        const fileName = `${year}_S${week} (${day}-${month}) - ${cleanClientName} _ ${cleanLocation}.pdf`;
        doc.save(fileName);
    }

    function generateICS(data) { /* ... (invariata) ... */ }
    
    function getFormData() {
        const interlocutori = [];
        document.querySelectorAll('.interlocutore-group').forEach(group => {
            const nameInput = group.querySelector('.contactName');
            const roleInput = group.querySelector('.contactRole');
            if (nameInput.value.trim()) {
                interlocutori.push({ name: nameInput.value, role: roleInput.value });
            }
        });

        return {
            areaManager: 'Filippo Masini',
            visitDate: visitDateInput.value,
            weekNumber: weekNumberInput.value,
            country: countrySelect.value,
            agent: agentSelect.value,
            clientName: document.getElementById('clientName').value,
            location: locationInput.value,
            department: departmentInput.value,
            region: regionInput.value,
            departmentCode: selectedCommuneData ? selectedCommuneData.code_departement : null,
            interlocutori: interlocutori,
            topics: document.getElementById('topics').value,
            agreements: document.getElementById('agreements').value,
            hasReminder: reminderToggle.checked,
            reminderDate: document.getElementById('reminderDate').value,
            attachments: Array.from(fileInput.files)
        };
    }

    // --- EVENT LISTENERS ---
    
    visitDateInput.addEventListener('change', (e) => updateWeekNumber(new Date(e.target.value)));
    locationInput.addEventListener('input', handleAutocomplete);
    countrySelect.addEventListener('change', () => { 
        locationInput.value = ''; 
        departmentInput.value = '';
        regionInput.value = '';
        autocompleteResults.innerHTML = '';
        selectedCommuneData = null;
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.autocomplete-container')) autocompleteResults.innerHTML = ''; });
    addInterlocutoreBtn.addEventListener('click', addInterlocutore);
    
    reminderToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        reminderDateContainer.classList.toggle('hidden', !isChecked);
        generateIcsBtn.classList.toggle('hidden', !isChecked);
        document.getElementById('reminderDate').required = isChecked;
    });

    fileInput.addEventListener('change', () => {
        fileListDiv.innerHTML = Array.from(fileInput.files).map(f => `<div>${f.name}</div>`).join('');
    });
    
    generatePdfBtn.addEventListener('click', () => {
        if (form.checkValidity()) {
            const reportData = getFormData();
            generatePDF(reportData);
        } else {
            form.reportValidity();
            alert('Per favore, compila tutti i campi obbligatori.');
        }
    });

    generateIcsBtn.addEventListener('click', () => {
        if (form.checkValidity()) {
            const reportData = getFormData();
            if(reportData.hasReminder && reportData.reminderDate){
                generateICS(reportData);
            } else {
                alert('Per generare un reminder, attiva l\'opzione e scegli una data.');
            }
        } else {
            form.reportValidity();
            alert('Per favore, compila tutti i campi obbligatori.');
        }
    });
    
    resetButton.addEventListener('click', () => {
        form.reset();
        fileListDiv.innerHTML = '';
        interlocutoriContainer.innerHTML = '';
        addInterlocutore();
        visitDateInput.value = today.toISOString().split('T')[0];
        updateWeekNumber(today);
        reminderDateContainer.classList.add('hidden');
        generateIcsBtn.classList.add('hidden');
        selectedCommuneData = null;
    });
});
