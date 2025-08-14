document.addEventListener('DOMContentLoaded', () => {

    // --- Logica di Login con Password Cammuffata (Base64) ---
    const loginOverlay = document.getElementById('login-overlay');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('error-message');
    const mainContainer = document.querySelector('.container');
    
    // La password è stata codificata in Base64 per non essere leggibile in chiaro.
    const correctPasswordEncoded = 'cm90ZWdsaWE=';

    const attemptLogin = () => {
        // Codifica l'input dell'utente in Base64 prima del confronto
        const enteredPasswordEncoded = btoa(passwordInput.value);

        if (enteredPasswordEncoded === correctPasswordEncoded) {
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
    
    fetch('agenti.json')
        .then(response => response.json())
        .then(encodedAgents => {
            encodedAgents.forEach(encodedAgent => {
                const decodedAgent = atob(encodedAgent);
                agentSelect.add(new Option(decodedAgent, decodedAgent));
            });
        })
        .catch(console.error);

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

    async function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200; // Aumentata leggermente per una migliore qualità
                    const MAX_HEIGHT = 1200;
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
                    
                    resolve({
                        dataUrl: canvas.toDataURL('image/jpeg', 0.7),
                        width: width,
                        height: height
                    });
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

        doc.setFont(FONT, 'bold').setFontSize(16).setTextColor(44, 62, 80);
        const titleLines = doc.splitTextToSize(pdfTitle, WIDTH - MARGIN * 2);
        doc.text(titleLines, WIDTH / 2, y, { align: 'center' });
        y += titleLines.length * 7 + 7;

        doc.setFont(FONT, 'normal').setFontSize(10).setTextColor(100);
        doc.text(`Area Manager: ${data.areaManager}`, MARGIN, y);
        doc.text(`Agente: ${data.agent}`, WIDTH - MARGIN, y, { align: 'right' });
        y += 7;
        doc.setLineWidth(0.5).line(MARGIN, y, WIDTH - MARGIN, y);
        y += 8;
        
        let mapBase64 = null;
        let mapFileName = null;
        if (data.country === 'Francia' && data.departmentCode) mapFileName = `${data.departmentCode}.jpeg`;
        else if (data.country === 'Monaco') mapFileName = '06.jpeg';
        else if (data.country === 'Belgio') mapFileName = 'belgium.jpeg';
        else if (data.country === 'Lussemburgo') mapFileName = 'luxembourg.jpeg';
        
        if (mapFileName) {
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
            textMaxWidth = mapX - MARGIN - 7;
        }

        let tempY = y;
        const addSectionTitle = (title) => {
            doc.setFont(FONT, 'bold').setFontSize(12).setTextColor(74, 144, 226);
            doc.text(title, MARGIN, tempY, { maxWidth: textMaxWidth });
            tempY += 7;
        };

        const printRow = (label, value) => {
            if (!value || value === 'N/D') return;
            doc.setFont(FONT, 'bold').setFontSize(10).setTextColor(50);
            const labelWidth = doc.getTextWidth(label);
            doc.text(label, MARGIN, tempY, { maxWidth: textMaxWidth });
            doc.setFont(FONT, 'normal');
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
        tempY += 6;

        addSectionTitle('Interlocutori');
        data.interlocutori.forEach(p => {
            doc.setFont(FONT, 'bold').setFontSize(10).setTextColor(50);
            const nameText = `- ${p.name}`;
            const roleText = `(${p.role})`;
            const nameWidth = doc.getTextWidth(nameText);
            if (nameWidth + doc.getTextWidth(roleText) + 5 < textMaxWidth) {
                doc.text(nameText, MARGIN, tempY);
                doc.setFont(FONT, 'normal').setFontSize(9).setTextColor(100);
                doc.text(roleText, MARGIN + nameWidth + 2, tempY);
                tempY += 5;
            } else {
                doc.text(nameText, MARGIN, tempY);
                tempY += 5;
                doc.setFont(FONT, 'normal').setFontSize(9).setTextColor(100);
                doc.text(roleText, MARGIN + 5, tempY);
                tempY += 5;
            }
        });
        
        y = Math.max(tempY, mapSectionYStart + (mapBase64 ? 65 : 0));
        
        const printLongTextSection = (title, content) => {
            y += 8;
            doc.setFont(FONT, 'bold').setFontSize(12).setTextColor(74, 144, 226);
            doc.text(title, MARGIN, y);
            y += 7;
            doc.setFont(FONT, 'normal').setFontSize(10).setTextColor(50);
            const splitText = doc.splitTextToSize(content || 'Nessun dato.', WIDTH - MARGIN * 2);
            doc.text(splitText, MARGIN, y);
            y += splitText.length * 5;
        };
        
        printLongTextSection('Argomenti Trattati:', data.topics);
        printLongTextSection('Cosa è stato concordato?', data.agreements);
        if (data.hasReminder) {
            printLongTextSection('Reminder Impostato:', `Follow-up richiesto per il ${new Date(data.reminderDate).toLocaleDateString('it-IT')}.`);
        }

        if (data.attachments.length > 0) {
            const compressedImagesData = await Promise.all(
                data.attachments.filter(f => f.type.startsWith('image/')).map(compressImage)
            );
            
            const CHUNK_SIZE = 4;
            for (let i = 0; i < compressedImagesData.length; i += CHUNK_SIZE) {
                const chunk = compressedImagesData.slice(i, i + CHUNK_SIZE);
                doc.addPage();
                doc.setFont(FONT, 'bold').setFontSize(14).setTextColor(44, 62, 80);
                doc.text(`Allegati Fotografici (Pagina ${Math.floor(i / CHUNK_SIZE) + 1})`, WIDTH / 2, MARGIN, { align: 'center' });

                const pageHeight = doc.internal.pageSize.getHeight();
                const contentHeight = pageHeight - MARGIN * 2 - 15;
                const contentWidth = WIDTH - MARGIN * 2;

                const drawImageInBox = (imgData, x, y, boxWidth, boxHeight) => {
                    const ratio = Math.min(boxWidth / imgData.width, boxHeight / imgData.height);
                    const newWidth = imgData.width * ratio;
                    const newHeight = imgData.height * ratio;
                    const xOffset = x + (boxWidth - newWidth) / 2;
                    const yOffset = y + (boxHeight - newHeight) / 2;
                    doc.addImage(imgData.dataUrl, 'JPEG', xOffset, yOffset, newWidth, newHeight, undefined, 'FAST');
                };

                if (chunk.length === 1) {
                    drawImageInBox(chunk[0], MARGIN, MARGIN + 15, contentWidth, contentHeight);
                } else if (chunk.length === 2) {
                    const boxHeight = (contentHeight - 5) / 2;
                    drawImageInBox(chunk[0], MARGIN, MARGIN + 15, contentWidth, boxHeight);
                    drawImageInBox(chunk[1], MARGIN, MARGIN + 20 + boxHeight, contentWidth, boxHeight);
                } else {
                    const boxWidth = (contentWidth - 5) / 2;
                    const boxHeight = (contentHeight - 5) / 2;
                    drawImageInBox(chunk[0], MARGIN, MARGIN + 15, boxWidth, boxHeight);
                    if (chunk[1]) drawImageInBox(chunk[1], MARGIN + boxWidth + 5, MARGIN + 15, boxWidth, boxHeight);
                    if (chunk[2]) drawImageInBox(chunk[2], MARGIN, MARGIN + 20 + boxHeight, boxWidth, boxHeight);
                    if (chunk[3]) drawImageInBox(chunk[3], MARGIN + boxWidth + 5, MARGIN + 20 + boxHeight, boxWidth, boxHeight);
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
