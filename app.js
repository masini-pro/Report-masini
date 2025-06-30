document.addEventListener('DOMContentLoaded', () => {

    // Registra il Service Worker per la PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(error => console.log('Errore registrazione Service Worker:', error));
    }

    // --- ELEMENTI DEL DOM ---
    const form = document.getElementById('reportForm');
    const visitDateInput = document.getElementById('visitDate');
    const weekNumberInput = document.getElementById('weekNumber');
    const agentSelect = document.getElementById('agent');
    const locationInput = document.getElementById('location');
    const autocompleteResults = document.getElementById('autocompleteResults');
    const interlocutoriContainer = document.getElementById('interlocutori-container');
    const addInterlocutoreBtn = document.getElementById('addInterlocutore');
    const reminderToggle = document.getElementById('reminderToggle');
    const reminderDateContainer = document.getElementById('reminderDateContainer');
    const resetButton = document.getElementById('resetButton');
    const fileInput = document.getElementById('attachments');
    const fileListDiv = document.getElementById('file-list');
    
    // NUOVI BOTTONI
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const generateIcsBtn = document.getElementById('generateIcsBtn');

    let comuni = [];
    let isComuniLoaded = false;

    // --- CARICAMENTO DATI INIZIALI ---
    fetch('comuni.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            comuni = data;
            isComuniLoaded = true;
        })
        .catch(error => console.error('Errore nel caricamento del file comuni.json:', error));
    
    fetch('agenti.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(agente => {
                const option = document.createElement('option');
                option.value = agente;
                option.textContent = agente;
                agentSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Errore nel caricamento del file agenti.json:', error));

    const today = new Date();
    visitDateInput.value = today.toISOString().split('T')[0];
    updateWeekNumber(today);
    
    // Aggiungi il primo interlocutore di default
    addInterlocutore();

    // --- FUNZIONI (invariate) ---
    function getWeekNumber(d) { /*...*/ return Math.ceil((((d - yearStart) / 86400000) + 1) / 7); }
    function updateWeekNumber(date) { /*...*/ }
    function handleAutocomplete(e) { /*...*/ }
    function addInterlocutore() { /*...*/ }
    async function generatePDF(data) { /*...*/ }
    function generateICS(data) { /*...*/ }
    
    // Ho riportato qui le funzioni per completezza, ma sono le stesse della versione precedente.
    // Lei può copiare e incollare l'intero file `app.js` senza problemi.

    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    function updateWeekNumber(date) { if (date) weekNumberInput.value = getWeekNumber(date); }
    function handleAutocomplete(e) {
        const query = e.target.value.toLowerCase().trim();
        autocompleteResults.innerHTML = '';
        if (query.length < 3 || !isComuniLoaded) return;
        const filteredComuni = comuni.filter(c => c.toLowerCase().startsWith(query)).slice(0, 7);
        filteredComuni.forEach(comune => {
            const div = document.createElement('div');
            div.classList.add('autocomplete-item');
            const match = comune.substring(0, query.length);
            const rest = comune.substring(query.length);
            div.innerHTML = `<strong>${match}</strong>${rest}`;
            div.addEventListener('click', () => { locationInput.value = comune; autocompleteResults.innerHTML = ''; });
            autocompleteResults.appendChild(div);
        });
    }
    function addInterlocutore() {
        const id = Date.now();
        const div = document.createElement('div');
        div.className = 'interlocutore-group';
        div.id = `interlocutore-${id}`;
        div.innerHTML = `<div class="form-group"><label for="contactName-${id}">Nome e Cognome</label><input type="text" id="contactName-${id}" class="contactName" placeholder="Nome Cognome" required></div><div class="form-group"><label for="contactRole-${id}">Ruolo</label><select id="contactRole-${id}" class="contactRole" required><option value="Titolare">Titolare</option><option value="Venditore di sala">Venditore di sala</option><option value="Responsabile di sede">Responsabile di sede</option><option value="Direttore commerciale">Direttore commerciale</option><option value="Buyer">Buyer</option><option value="Alto dirigente">Alto dirigente</option></select></div><button type="button" class="remove-interlocutore-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clip-rule="evenodd" /></svg></button>`;
        interlocutoriContainer.appendChild(div);
        div.querySelector('.remove-interlocutore-btn').addEventListener('click', () => { div.remove(); });
    }
    async function generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const FONT = 'Helvetica'; const MARGIN = 20; const WIDTH = doc.internal.pageSize.getWidth(); let y = MARGIN;
        const addText = (text, options) => {
            const defaults = { x: MARGIN, size: 11, style: 'normal', color: [50,50,50], space: 5 }; const opt = { ...defaults, ...options };
            if (y + opt.space > 280) { doc.addPage(); y = MARGIN; }
            doc.setFont(FONT, opt.style).setFontSize(opt.size).setTextColor(opt.color[0], opt.color[1] || opt.color[0], opt.color[2] || opt.color[0]); doc.text(text, opt.x, y, opt.align ? {align: opt.align} : undefined); y += opt.space;
        };
        addText('Report Visita Cliente', { size: 20, style: 'bold', color: [44,62,80], x: WIDTH / 2, align: 'center', space: 15 });
        doc.setFont(FONT, 'normal').setFontSize(10).setTextColor(100); doc.text(`Area Manager: ${data.areaManager}`, MARGIN, y); doc.text(`Agente: ${data.agent}`, WIDTH - MARGIN, y, { align: 'right' }); y += 10;
        doc.setLineWidth(0.5).line(MARGIN, y, WIDTH - MARGIN, y); y += 10;
        addText('Riepilogo Visita', { size: 12, style: 'bold', color: [74,144,226], space: 7 });
        const printRow = (label, value) => { doc.setFont(FONT, 'bold').setFontSize(11).setTextColor(50); doc.text(label, MARGIN, y); doc.setFont(FONT, 'normal'); doc.text(value, MARGIN + 45, y); y += 7; };
        printRow('Data Visita:', new Date(data.visitDate).toLocaleDateString('it-IT')); printRow('Settimana N°:', data.weekNumber); printRow('Paese:', data.country); printRow('Cliente:', data.clientName); printRow('Luogo / Sede:', data.location); y += 5;
        addText('Interlocutori', { size: 12, style: 'bold', color: [74,144,226], space: 7 });
        data.interlocutori.forEach(p => { printRow(`- ${p.name}`, `(${p.role})`); }); y += 5;
        const printSection = (title, content) => {
            addText(title, { size: 12, style: 'bold', color: [74,144,226], space: 7 });
            const splitText = doc.splitTextToSize(content || 'Nessun dato.', WIDTH - (MARGIN * 2));
            addText(splitText, { size: 11, style: 'normal', color: [50,50,50], space: 5 * splitText.length + 5 });
        };
        printSection('Argomenti Trattati:', data.topics); printSection('Cosa è stato concordato?', data.agreements);
        if (data.hasReminder) { printSection('Reminder Impostato:', `Follow-up richiesto per il ${new Date(data.reminderDate).toLocaleDateString('it-IT')}.`); }
        if (data.attachments.length > 0) {
            const imageFiles = data.attachments.filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0) {
                 doc.addPage(); y = MARGIN; addText('Allegati Fotografici', { size: 16, style: 'bold', color: [44,62,80], x: WIDTH / 2, align: 'center', space: 15 });
                for (const file of imageFiles) {
                    const imgData = await new Promise(resolve => { const reader = new FileReader(); reader.onload = e => resolve(e.target.result); reader.readAsDataURL(file); });
                    const imgProps = doc.getImageProperties(imgData); const imgWidth = WIDTH - MARGIN * 2; const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                    if (y + imgHeight > 280) { doc.addPage(); y = MARGIN; }
                    doc.addImage(imgData, 'JPEG', MARGIN, y, imgWidth, imgHeight); y += imgHeight + 10;
                }
            }
        }
        doc.save(`Report_${data.clientName}_${data.visitDate}.pdf`);
    }
    function generateICS(data) {
        const formatDate = (dateStr) => dateStr.replace(/-/g, '');
        const interlocutoriText = data.interlocutori.map(p => `${p.name} (${p.role})`).join(', ');
        const description = [`CLIENTE: ${data.clientName}`, `LUOGO: ${data.location}`, `AREA MANAGER: ${data.areaManager}`, `AGENTE: ${data.agent}`, `INTERLOCUTORI: ${interlocutoriText}`, `\\nARGOMENTI TRATTATI:\\n${data.topics.replace(/\n/g, '\\n')}`, `\\nACCORDI PRESI:\\n${data.agreements.replace(/\n/g, '\\n')}`].join('\\n');
        const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ReportGenerator//IT', 'BEGIN:VEVENT', `UID:${Date.now()}@reportapp.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${formatDate(data.reminderDate)}`, `SUMMARY:Follow-up: ${data.clientName}`, `DESCRIPTION:${description}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Reminder_${data.clientName}_${data.reminderDate}.ics`; link.click();
    }
    
    // --- Funzione per raccogliere i dati dal form ---
    function getFormData() {
        const interlocutori = [];
        document.querySelectorAll('.interlocutore-group').forEach(group => {
            const nameInput = group.querySelector('.contactName');
            const roleInput = group.querySelector('.contactRole');
            if (nameInput.value) { // Aggiungi solo se c'è un nome
                interlocutori.push({
                    name: nameInput.value,
                    role: roleInput.value
                });
            }
        });

        return {
            areaManager: 'Filippo Masini',
            visitDate: visitDateInput.value,
            weekNumber: weekNumberInput.value,
            country: document.getElementById('country').value,
            agent: agentSelect.value,
            clientName: document.getElementById('clientName').value,
            location: locationInput.value,
            interlocutori: interlocutori,
            topics: document.getElementById('topics').value,
            agreements: document.getElementById('agreements').value,
            hasReminder: reminderToggle.checked,
            reminderDate: document.getElementById('reminderDate').value,
            attachments: Array.from(fileInput.files)
        };
    }

    // --- EVENT LISTENERS (MODIFICATI) ---
    
    visitDateInput.addEventListener('change', (e) => updateWeekNumber(new Date(e.target.value)));
    locationInput.addEventListener('input', handleAutocomplete);
    document.addEventListener('click', (e) => { if (!e.target.closest('.autocomplete-container')) autocompleteResults.innerHTML = ''; });
    addInterlocutoreBtn.addEventListener('click', addInterlocutore);
    
    reminderToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        reminderDateContainer.classList.toggle('hidden', !isChecked);
        generateIcsBtn.classList.toggle('hidden', !isChecked); // Mostra/nascondi il pulsante del reminder
        document.getElementById('reminderDate').required = isChecked;
    });

    fileInput.addEventListener('change', () => {
        fileListDiv.innerHTML = Array.from(fileInput.files).map(f => `<div>${f.name}</div>`).join('');
    });
    
    // Listener per il pulsante PDF
    generatePdfBtn.addEventListener('click', () => {
        if (form.checkValidity()) {
            const reportData = getFormData();
            generatePDF(reportData);
        } else {
            form.reportValidity(); // Mostra gli errori di validazione del browser
            alert('Per favore, compila tutti i campi obbligatori.');
        }
    });

    // Listener per il pulsante ICS
    generateIcsBtn.addEventListener('click', () => {
        if (form.checkValidity()) {
            const reportData = getFormData();
            if(reportData.hasReminder && reportData.reminderDate){
                generateICS(reportData);
            } else {
                alert('Per generare un reminder, attiva l\'opzione e scegli una data.')
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
    });
});
