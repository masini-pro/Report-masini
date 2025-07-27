document.addEventListener('DOMContentLoaded', () => {

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
    let selectedCommuneData = null; // Salva i dati del comune selezionato

    // --- CARICAMENTO DATI INIZIALI ---
    
    fetch('comuni.json')
        .then(response => response.ok ? response.json() : Promise.reject('Errore caricamento comuni.json'))
        .then(data => {
            comuniData = data;
            isComuniLoaded = true;
        })
        .catch(error => console.error(error));
    
    fetch('agenti.json')
        .then(response => response.ok ? response.json() : Promise.reject('Errore caricamento agenti.json'))
        .then(data => {
            data.forEach(agente => {
                const option = document.createElement('option');
                option.value = agente;
                option.textContent = agente;
                agentSelect.appendChild(option);
            });
        })
        .catch(error => console.error(error));

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
        selectedCommuneData = null; // Resetta i dati

        if (query.length < 2 || !isComuniLoaded) return;
        
        const filteredComuni = comuniData
            .filter(c => c.pays === selectedCountry && c.commune.toLowerCase().startsWith(query))
            .slice(0, 7);
        
        filteredComuni.forEach(comuneObj => {
            const div = document.createElement('div');
            div.classList.add('autocomplete-item');
            const match = comuneObj.commune.substring(0, query.length);
            const rest = comuneObj.commune.substring(query.length);
            div.innerHTML = `<strong>${match}</strong>${rest}`;
            
            div.addEventListener('click', () => {
                selectCommune(comuneObj);
            });
            autocompleteResults.appendChild(div);
        });
    }
    
    function selectCommune(comuneObj) {
        selectedCommuneData = comuneObj; // Salva l'oggetto completo
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

    // --- NUOVA FUNZIONE PER CARICARE L'IMMAGINE COME BASE64 ---
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
        const MARGIN = 20;
        const WIDTH = doc.internal.pageSize.getWidth();
        let y = MARGIN;

        const visitDateObj = new Date(data.visitDate);
        visitDateObj.setMinutes(visitDateObj.getMinutes() + visitDateObj.getTimezoneOffset());
        const dateInLettere = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(visitDateObj);
        const pdfTitle = `S${data.weekNumber} - Visita ${data.clientName} a ${data.location} in data ${dateInLettere}`;

        const addText = (text, options) => {
            const defaults = { x: MARGIN, y: y, size: 11, style: 'normal', color: [50,50,50], space: 5, align: null, maxWidth: 0 };
            const opt = { ...defaults, ...options };
            if (opt.y + opt.space > 280) { doc.addPage(); y = MARGIN; opt.y = y; }
            doc.setFont(FONT, opt.style).setFontSize(opt.size).setTextColor(opt.color[0], opt.color[1] || opt.color[0], opt.color[2] || opt.color[0]);
            doc.text(text, opt.x, opt.y, { align: opt.align, maxWidth: opt.maxWidth > 0 ? opt.maxWidth : undefined });
            y = opt.y + opt.space;
        };

        addText(pdfTitle, { size: 16, style: 'bold', color: [44, 62, 80], x: WIDTH / 2, align: 'center', space: 15 });
        
        doc.setFont(FONT, 'normal').setFontSize(10).setTextColor(100);
        doc.text(`Area Manager: ${data.areaManager}`, MARGIN, y);
        doc.text(`Agente: ${data.agent}`, WIDTH - MARGIN, y, { align: 'right' });
        y += 10;
        doc.setLineWidth(0.5).line(MARGIN, y, WIDTH - MARGIN, y);
        y += 10;
        
        let mapBase64 = null;
        if (data.departmentCode) {
            // Usa il link raw di GitHub per l'accesso diretto all'immagine
            const mapUrl = `https://raw.githubusercontent.com/masini-pro/Report-masini/main/FR_maps/${data.departmentCode}.jpeg`;
            mapBase64 = await loadImageAsBase64(mapUrl);
        }

        const mapSectionYStart = y;
        let textMaxWidth = 0; // Larghezza massima del testo, 0 = piena larghezza
        if (mapBase64) {
            const mapWidth = 50;
            const mapHeight = 50;
            const mapX = WIDTH - MARGIN - mapWidth;
            doc.addImage(mapBase64, 'JPEG', mapX, mapSectionYStart, mapWidth, mapHeight);
            textMaxWidth = mapX - MARGIN - 5; // Calcola la larghezza per il testo a sinistra della mappa
        }

        let tempY = y; // Usa una y temporanea per il layout a colonne
        const printRow = (label, value) => {
            if (!value || value === 'N/D') return;
            doc.setFont(FONT, 'bold').setFontSize(11).setTextColor(50);
            doc.text(label, MARGIN, tempY, { maxWidth: textMaxWidth });
            doc.setFont(FONT, 'normal');
            doc.text(value, MARGIN + 45, tempY, { maxWidth: textMaxWidth - 45 });
            tempY += 7;
        };
        
        addText('Riepilogo Visita', { y: tempY, size: 12, style: 'bold', color: [74,144,226], space: 7, maxWidth: textMaxWidth });
        tempY += 7;

        printRow('Data Visita:', new Date(data.visitDate).toLocaleDateString('it-IT'));
        printRow('Settimana N°:', data.weekNumber);
        printRow('Paese:', data.country);
        printRow('Cliente:', data.clientName);
        printRow('Comune:', data.location);
        printRow('Dipartimento:', data.department);
        printRow('Regione:', data.region);
        
        // Aggiorna la Y principale alla posizione più bassa tra il testo e la mappa
        y = Math.max(tempY, mapSectionYStart + (mapBase64 ? 55 : 0));
        y += 5;

        addText('Interlocutori', { y: y, size: 12, style: 'bold', color: [74,144,226], space: 7 });
        tempY = y + 7;
        data.interlocutori.forEach(p => { printRow(`- ${p.name}`, `(${p.role})`); });
        y = tempY + 5;
        
        const printSection = (title, content) => {
            addText(title, { y: y, size: 12, style: 'bold', color: [74,144,226], space: 7 });
            const splitText = doc.splitTextToSize(content || 'Nessun dato.', WIDTH - (MARGIN * 2));
            addText(splitText, { y: y + 7, size: 11, style: 'normal', color: [50,50,50], space: 5 * splitText.length + 5 });
            y += 7 + (5 * splitText.length + 5);
        };
        printSection('Argomenti Trattati:', data.topics);
        printSection('Cosa è stato concordato?', data.agreements);
        if (data.hasReminder) {
            printSection('Reminder Impostato:', `Follow-up richiesto per il ${new Date(data.reminderDate).toLocaleDateString('it-IT')}.`);
        }

        if (data.attachments.length > 0) {
            const imageFiles = data.attachments.filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0) {
                 doc.addPage();
                 y = MARGIN;
                 addText('Allegati Fotografici', { y: y, size: 16, style: 'bold', color: [44,62,80], x: WIDTH / 2, align: 'center', space: 15 });
                for (const file of imageFiles) {
                    const imgData = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });
                    const imgProps = doc.getImageProperties(imgData);
                    const imgWidth = WIDTH - MARGIN * 2;
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                    if (y + imgHeight > 280) { doc.addPage(); y = MARGIN; }
                    doc.addImage(imgData, 'JPEG', MARGIN, y, imgWidth, imgHeight);
                    y += imgHeight + 10;
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

    function generateICS(data) { /* ... (funzione invariata) ... */ }
    
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
            departmentCode: selectedCommuneData ? selectedCommuneData.code_departement : null, // Aggiunge il codice dipartimento
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
