// Smart Health - AI Medicine Recognition & Description
// Using Gemini 1.5 Flash Vision API (Client-side)

// Global state variables
let currentLanguage = 'en'; // 'en' or 'gu'
let currentResultData = null; // Stored scan output JSON
let speechUtterance = null;
let isSpeaking = false;
let historyList = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    initTheme();

    // Load Scan History from localStorage
    loadHistory();

    // Setup Event Listeners
    initEventListeners();
});

// --- Theme Controller ---
function initTheme() {
    const savedTheme = localStorage.getItem('sh_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('sh_theme', newTheme);
            updateThemeToggleIcon(newTheme);
        });
    }
}

function updateThemeToggleIcon(theme) {
    const icon = document.querySelector('#theme-toggle-btn span');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// --- Event Listeners Initialization ---
function initEventListeners() {
    const uploadInput = document.getElementById('image-upload-input');
    const uploadZone = document.getElementById('upload-zone-wrapper');
    const removePreviewBtn = document.getElementById('remove-preview-btn');
    const form = document.getElementById('scan-form');
    
    // Drag & Drop
    if (uploadZone && uploadInput) {
        uploadZone.addEventListener('click', () => uploadInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });
        
        uploadInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', clearImagePreview);
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            startMedicineAnalysis();
        });
    }

    // Language tabs listeners
    const langEnBtn = document.getElementById('lang-en-btn');
    const langGuBtn = document.getElementById('lang-gu-btn');
    if (langEnBtn && langGuBtn) {
        langEnBtn.addEventListener('click', () => switchLanguage('en'));
        langGuBtn.addEventListener('click', () => switchLanguage('gu'));
    }

    // Actions Toolbar Listeners
    const copyBtn = document.getElementById('action-copy-btn');
    const printBtn = document.getElementById('action-print-btn');
    const pdfBtn = document.getElementById('action-pdf-btn');
    const shareBtn = document.getElementById('action-share-btn');
    
    if (copyBtn) copyBtn.addEventListener('click', copyResultsToClipboard);
    if (printBtn) printBtn.addEventListener('click', () => window.print());
    if (pdfBtn) pdfBtn.addEventListener('click', downloadPDFReport);
    if (shareBtn) shareBtn.addEventListener('click', shareReportUsingWebShare);

    // Audio reader controls
    const playAudioBtn = document.getElementById('play-audio-btn');
    const stopAudioBtn = document.getElementById('stop-audio-btn');
    if (playAudioBtn) playAudioBtn.addEventListener('click', toggleSpeechReader);
    if (stopAudioBtn) stopAudioBtn.addEventListener('click', stopSpeechReader);

    // History & Search sidebar
    const searchHistoryInput = document.getElementById('search-history-input');
    const filterFavoritesBtn = document.getElementById('filter-favorites-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const exportHistoryBtn = document.getElementById('export-history-btn');

    if (searchHistoryInput) {
        searchHistoryInput.addEventListener('input', (e) => renderHistoryList(e.target.value, filterFavoritesBtn.classList.contains('active')));
    }
    if (filterFavoritesBtn) {
        filterFavoritesBtn.addEventListener('click', () => {
            const active = filterFavoritesBtn.classList.toggle('active');
            filterFavoritesBtn.classList.toggle('btn-glass-active', active);
            renderHistoryList(searchHistoryInput.value, active);
        });
    }
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearAllHistoryData);
    }
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', exportHistoryAsJSONFile);
    }
}

// --- Image Handling and Compression ---
let selectedImageBase64 = null;
let selectedImageFile = null;

function handleFileSelect(file) {
    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToastAlert('Invalid file format. Please upload JPG, PNG, or WEBP image.', 'error');
        return;
    }

    // Size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToastAlert('Image size exceeds 5MB limit. Please upload a smaller photo.', 'error');
        return;
    }

    selectedImageFile = file;

    // Show loading skeleton and compress image before base64 assignment
    const reader = new FileReader();
    reader.onload = function(e) {
        compressImage(e.target.result, 1024, 0.75, (compressedBase64) => {
            selectedImageBase64 = compressedBase64;
            
            // Render Preview
            document.getElementById('upload-zone-wrapper').style.display = 'none';
            document.getElementById('preview-img-element').src = compressedBase64;
            document.getElementById('image-preview-panel').style.display = 'block';
            document.getElementById('scan-submit-btn').removeAttribute('disabled');
        });
    };
    reader.readAsDataURL(file);
}

function clearImagePreview() {
    selectedImageBase64 = null;
    selectedImageFile = null;
    document.getElementById('image-upload-input').value = '';
    document.getElementById('image-preview-panel').style.display = 'none';
    document.getElementById('upload-zone-wrapper').style.display = 'block';
    document.getElementById('scan-submit-btn').setAttribute('disabled', 'true');
}

/**
 * Compresses an image on client side using Canvas API
 */
function compressImage(base64Source, maxDimension, quality, callback) {
    const img = new Image();
    img.src = base64Source;
    img.onload = function() {
        let width = img.width;
        let height = img.height;

        // Resize logic keeping aspect ratio
        if (width > height) {
            if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            }
        } else {
            if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        callback(compressedBase64);
    };
}

// --- Gemini Vision API Integration ---
function startMedicineAnalysis() {
    if (!selectedImageBase64) {
        showToastAlert('Please upload or snap a medicine image first.', 'error');
        return;
    }

    if (typeof CONFIG === 'undefined' || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || !CONFIG.GEMINI_API_KEY) {
        showToastAlert('Gemini API Key is missing! Please configure config.js with a valid key.', 'error');
        return;
    }

    // Stop speaking if active
    stopSpeechReader();

    // UI state loading
    setLoadingState(true);
    
    // Clean preview base64 header
    const base64Clean = selectedImageBase64.split(',')[1];
    const mimeType = selectedImageBase64.split(';')[0].split(':')[1];

    // Build Prompt with exact requirements
    const prompt = `Analyze this medicine strip, tablet, bottle, or packaging image. Perform OCR to extract text and identify the medicine details.
Provide comprehensive information covering all these 27 fields:
1. medicineName (Commercial/Name on box)
2. genericName
3. brandName
4. saltComposition
5. confidenceScore (a percentage value, e.g. "92%")
6. manufacturer
7. ocrTextExtracted (what text you read on package)
8. English and Gujarati translation mappings for:
   - uses
   - benefits
   - howItWorks
   - dosage
   - beforeAfterFood
   - sideEffects
   - seriousSideEffects
   - warnings
   - pregnancySafety
   - breastfeedingSafety
   - kidneyWarning
   - liverWarning
   - heartWarning
   - alcoholInteraction
   - drugInteractions
   - drivingWarning
   - missedDose
   - overdose
   - storage
   - ageRestriction
   - prescriptionOrOtc
   - availableStrengths
   - alternatives (comma separated names)
   - faqs (Provide exactly 3 common questions and answers)

If the image is blurry, does not contain medicine packaging, or is unrecognizable, set the "error" field in the output JSON containing a helpful error message.
Return the result strictly as a valid JSON object matching the following structure:
{
  "medicineName": "string",
  "genericName": "string",
  "brandName": "string",
  "saltComposition": "string",
  "confidenceScore": "string",
  "manufacturer": "string",
  "ocrTextExtracted": "string",
  "error": "string or null",
  "en": {
    "uses": "string",
    "benefits": "string",
    "howItWorks": "string",
    "dosage": "string",
    "beforeAfterFood": "string",
    "sideEffects": "string",
    "seriousSideEffects": "string",
    "warnings": "string",
    "pregnancySafety": "string",
    "breastfeedingSafety": "string",
    "kidneyWarning": "string",
    "liverWarning": "string",
    "heartWarning": "string",
    "alcoholInteraction": "string",
    "drugInteractions": "string",
    "drivingWarning": "string",
    "missedDose": "string",
    "overdose": "string",
    "storage": "string",
    "ageRestriction": "string",
    "prescriptionOrOtc": "string",
    "availableStrengths": "string",
    "alternatives": "string",
    "faqs": [{"q": "string", "a": "string"}]
  },
  "gu": {
    "uses": "string",
    "benefits": "string",
    "howItWorks": "string",
    "dosage": "string",
    "beforeAfterFood": "string",
    "sideEffects": "string",
    "seriousSideEffects": "string",
    "warnings": "string",
    "pregnancySafety": "string",
    "breastfeedingSafety": "string",
    "kidneyWarning": "string",
    "liverWarning": "string",
    "heartWarning": "string",
    "alcoholInteraction": "string",
    "drugInteractions": "string",
    "drivingWarning": "string",
    "missedDose": "string",
    "overdose": "string",
    "storage": "string",
    "ageRestriction": "string",
    "prescriptionOrOtc": "string",
    "availableStrengths": "string",
    "alternatives": "string",
    "faqs": [{"q": "string", "a": "string"}]
  }
}
Note: Ensure Gujarati translations inside the "gu" object are readable and written in Gujarati script. Do not write Gujlish in the "gu" object.`;

    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Clean
                    }
                }
            ]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    // Simulating progress bar steps
    animateProgress();

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP network error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        setLoadingState(false);
        
        try {
            const rawText = data.candidates[0].content.parts[0].text;
            const parsedData = JSON.parse(rawText.trim());
            
            if (parsedData.error) {
                showToastAlert(parsedData.error, 'warning');
                renderErrorCard(parsedData.error);
                return;
            }

            currentResultData = parsedData;
            
            // Add to Local History
            addToHistory(parsedData);
            
            // Render Results
            renderScanResults();
            showToastAlert('Medicine analysis completed successfully!', 'success');
            
        } catch (e) {
            console.error('JSON parsing failure from AI text:', e);
            showToastAlert('Failed to parse AI medical response.', 'error');
            renderErrorCard('The AI model response could not be parsed into structure. Please try capturing a clearer picture.');
        }
    })
    .catch(err => {
        setLoadingState(false);
        console.error('Gemini API fetch error:', err);
        
        let errorMsg = 'Failed to connect to the AI service. Please check your internet connection and try again.';
        if (!navigator.onLine) {
            errorMsg = 'No internet connection detected. Please verify your connection status.';
        }
        
        showToastAlert(errorMsg, 'error');
        renderErrorCard(errorMsg);
    });
}

let progressInterval = null;
function animateProgress() {
    const bar = document.getElementById('progress-bar-fill');
    if (!bar) return;
    
    bar.style.width = '0%';
    let pct = 0;
    
    if (progressInterval) clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        if (pct < 90) {
            pct += Math.floor(Math.random() * 15) + 5;
            if (pct > 90) pct = 90;
            bar.style.width = `${pct}%`;
        }
    }, 400);
}

function setLoadingState(isLoading) {
    const loadingWrapper = document.getElementById('loading-state-wrapper');
    const resultPanel = document.getElementById('results-section-panel');
    const scanBtn = document.getElementById('scan-submit-btn');
    
    if (isLoading) {
        if (loadingWrapper) loadingWrapper.style.display = 'flex';
        if (resultPanel) resultPanel.style.display = 'none';
        if (scanBtn) scanBtn.setAttribute('disabled', 'true');
    } else {
        if (progressInterval) clearInterval(progressInterval);
        const bar = document.getElementById('progress-bar-fill');
        if (bar) bar.style.width = '100%';
        
        setTimeout(() => {
            if (loadingWrapper) loadingWrapper.style.display = 'none';
            if (scanBtn) scanBtn.removeAttribute('disabled');
        }, 500);
    }
}

// --- Render Layout Functions ---
function renderScanResults() {
    if (!currentResultData) return;

    const resultsPanel = document.getElementById('results-section-panel');
    resultsPanel.style.display = 'block';

    // Global Metadata
    document.getElementById('res-med-name').textContent = currentResultData.medicineName || 'N/A';
    document.getElementById('res-generic-name').textContent = currentResultData.genericName || 'N/A';
    document.getElementById('res-brand-name').textContent = currentResultData.brandName || 'N/A';
    document.getElementById('res-composition').textContent = currentResultData.saltComposition || 'N/A';
    document.getElementById('res-confidence').textContent = currentResultData.confidenceScore || '90%';
    document.getElementById('res-manufacturer').textContent = currentResultData.manufacturer || 'N/A';
    document.getElementById('res-ocr').textContent = currentResultData.ocrTextExtracted || 'None';

    // Synchronize Favorite Star button state
    const curUserFav = isFavorite(currentResultData.medicineName);
    const starIcon = document.getElementById('favorite-toggle-icon');
    if (starIcon) {
        starIcon.textContent = curUserFav ? '⭐' : '☆';
        starIcon.onclick = () => toggleFavoriteStatus(currentResultData.medicineName);
    }

    // Languages dynamic rendering
    renderTranslatedContent();

    // Scroll to results smoothly
    resultsPanel.scrollIntoView({ behavior: 'smooth' });
}

function renderTranslatedContent() {
    const lang = currentLanguage;
    const content = currentResultData[lang];
    if (!content) return;

    document.getElementById('res-uses').textContent = content.uses || 'N/A';
    document.getElementById('res-benefits').textContent = content.benefits || 'N/A';
    document.getElementById('res-works').textContent = content.howItWorks || 'N/A';
    document.getElementById('res-dosage').textContent = content.dosage || 'N/A';
    document.getElementById('res-food').textContent = content.beforeAfterFood || 'N/A';
    document.getElementById('res-side-effects').textContent = content.sideEffects || 'N/A';
    document.getElementById('res-serious-side-effects').textContent = content.seriousSideEffects || 'N/A';
    document.getElementById('res-warnings').textContent = content.warnings || 'N/A';

    // Safety Grid
    document.getElementById('res-preg-safety').textContent = content.pregnancySafety || 'N/A';
    document.getElementById('res-breast-safety').textContent = content.breastfeedingSafety || 'N/A';
    document.getElementById('res-kidney-safety').textContent = content.kidneyWarning || 'N/A';
    document.getElementById('res-liver-safety').textContent = content.liverWarning || 'N/A';
    document.getElementById('res-heart-safety').textContent = content.heartWarning || 'N/A';
    
    // Interactions & Warnings
    document.getElementById('res-alcohol').textContent = content.alcoholInteraction || 'N/A';
    document.getElementById('res-drug-interact').textContent = content.drugInteractions || 'N/A';
    document.getElementById('res-driving').textContent = content.drivingWarning || 'N/A';
    document.getElementById('res-missed-dose').textContent = content.missedDose || 'N/A';
    document.getElementById('res-overdose').textContent = content.overdose || 'N/A';
    document.getElementById('res-storage').textContent = content.storage || 'N/A';
    document.getElementById('res-age-restrict').textContent = content.ageRestriction || 'N/A';
    document.getElementById('res-prescription').textContent = content.prescriptionOrOtc || 'N/A';
    document.getElementById('res-strengths').textContent = content.availableStrengths || 'N/A';

    // Alternatives
    const altContainer = document.getElementById('res-alternatives');
    if (content.alternatives) {
        const alts = content.alternatives.split(',').map(a => a.trim());
        altContainer.innerHTML = alts.map(a => `<span class="badge btn-glass text-primary me-2 mb-2" style="font-size:0.85rem; padding:0.4rem 0.8rem;">${a}</span>`).join('');
    } else {
        altContainer.innerHTML = '<span class="text-muted">None available</span>';
    }

    // FAQs Accordion
    const faqContainer = document.getElementById('res-faqs-accordion');
    if (content.faqs && content.faqs.length > 0) {
        faqContainer.innerHTML = content.faqs.map((faq, idx) => `
            <div class="accordion-item bg-transparent border-0 mb-3">
                <h2 class="accordion-header" id="heading-${idx}">
                    <button class="accordion-button collapsed btn-glass text-primary rounded-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${idx}" aria-expanded="false">
                        ❓ ${faq.q}
                    </button>
                </h2>
                <div id="collapse-${idx}" class="accordion-collapse collapse" aria-labelledby="heading-${idx}" data-bs-parent="#res-faqs-accordion">
                    <div class="accordion-body glass-card mt-2 rounded-3 text-muted" style="border-color:var(--glass-border);">
                        ${faq.a}
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        faqContainer.innerHTML = '<p class="text-muted">No FAQs loaded.</p>';
    }
}

function renderErrorCard(msg) {
    const resultsPanel = document.getElementById('results-section-panel');
    resultsPanel.style.display = 'none';

    // Create or show custom error container
    let errDiv = document.getElementById('analysis-error-panel');
    if (!errDiv) {
        errDiv = document.createElement('div');
        errDiv.id = 'analysis-error-panel';
        errDiv.className = 'container mt-4';
        resultsPanel.parentNode.insertBefore(errDiv, resultsPanel.nextSibling);
    }

    errDiv.innerHTML = `
        <div class="glass-panel p-5 text-center" style="border-color:var(--color-danger);">
            <span style="font-size: 3.5rem;">⚠️</span>
            <h2 class="text-danger mt-3">Medicine Recognition Failed</h2>
            <p class="text-muted mt-2" style="max-width: 600px; margin: 0 auto;">${msg}</p>
            <button class="btn btn-glass mt-4" onclick="clearImagePreview(); this.parentNode.parentNode.remove();">Try Another Image</button>
        </div>
    `;
    errDiv.scrollIntoView({ behavior: 'smooth' });
}

// --- Language Switching ---
function switchLanguage(lang) {
    if (currentLanguage === lang) return;
    currentLanguage = lang;

    const langEnBtn = document.getElementById('lang-en-btn');
    const langGuBtn = document.getElementById('lang-gu-btn');

    if (lang === 'en') {
        langEnBtn.classList.add('btn-glass-active');
        langGuBtn.classList.remove('btn-glass-active');
    } else {
        langGuBtn.classList.add('btn-glass-active');
        langEnBtn.classList.remove('btn-glass-active');
    }

    // Stop speaking if playing
    stopSpeechReader();

    // Re-render
    renderTranslatedContent();
}

// --- Text To Speech (Web Speech API) ---
function toggleSpeechReader() {
    if (isSpeaking) {
        pauseSpeechReader();
        return;
    }

    if (!currentResultData) return;

    // Get text representation based on selected language
    const lang = currentLanguage;
    const content = currentResultData[lang];
    if (!content) return;

    const textToSpeak = `
        Medicine Name: ${currentResultData.medicineName}. 
        Generic Name: ${currentResultData.genericName}. 
        Salt Composition: ${currentResultData.saltComposition}. 
        Uses: ${content.uses}. 
        Warnings: ${content.warnings}.
        Disclaimer: This information is for educational purposes only.
    `;

    // Initialize Utterance
    window.speechSynthesis.cancel(); // Clear any pending audio queue

    speechUtterance = new SpeechSynthesisUtterance(textToSpeak);
    speechUtterance.lang = lang === 'en' ? 'en-US' : 'gu-IN';

    // Attempt to select correct voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(speechUtterance.lang));
    if (matchedVoice) {
        speechUtterance.voice = matchedVoice;
    }

    speechUtterance.onstart = () => {
        isSpeaking = true;
        document.getElementById('play-audio-btn').textContent = '⏸️ Pause';
    };

    speechUtterance.onend = () => {
        isSpeaking = false;
        document.getElementById('play-audio-btn').textContent = '🔊 Read Aloud';
    };

    speechUtterance.onerror = (e) => {
        console.error('Speech synthesis failure:', e);
        isSpeaking = false;
        document.getElementById('play-audio-btn').textContent = '🔊 Read Aloud';
    };

    window.speechSynthesis.speak(speechUtterance);
}

function pauseSpeechReader() {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        isSpeaking = false;
        document.getElementById('play-audio-btn').textContent = '▶️ Resume';
    } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        isSpeaking = true;
        document.getElementById('play-audio-btn').textContent = '⏸️ Pause';
    }
}

function stopSpeechReader() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    const playBtn = document.getElementById('play-audio-btn');
    if (playBtn) playBtn.textContent = '🔊 Read Aloud';
}

// --- Action Toolbar Operations ---
function copyResultsToClipboard() {
    if (!currentResultData) return;

    const lang = currentLanguage;
    const content = currentResultData[lang];
    if (!content) return;

    const reportText = `
CLINICAL MEDICINE ANALYSIS REPORT
--------------------------------------------------
Medicine Name: ${currentResultData.medicineName}
Generic Name: ${currentResultData.genericName}
Brand Name: ${currentResultData.brandName}
Salt Composition: ${currentResultData.saltComposition}
Manufacturer: ${currentResultData.manufacturer}
AI Confidence Score: ${currentResultData.confidenceScore}
OCR Package Text: ${currentResultData.ocrTextExtracted}

KEY INSTRUCTIONS (${lang.toUpperCase()})
--------------------------------------------------
Uses: ${content.uses}
Benefits: ${content.benefits}
How it Works: ${content.howItWorks}
Dosage: ${content.dosage}
Before/After Food: ${content.beforeAfterFood}
Side Effects: ${content.sideEffects}
Serious Side Effects: ${content.seriousSideEffects}
Warnings: ${content.warnings}

Prescription Status: ${content.prescriptionOrOtc}
Alternatives: ${content.alternatives}

--------------------------------------------------
DISCLAIMER: This AI-generated information is for educational purposes only and should not replace professional medical advice. Always consult a qualified doctor before taking any medicine.
    `;

    navigator.clipboard.writeText(reportText.trim())
        .then(() => showToastAlert('Report copied to clipboard!', 'success'))
        .catch(err => showToastAlert('Failed to copy text.', 'error'));
}

function downloadPDFReport() {
    if (!currentResultData) return;
    
    // We target the results container element
    const element = document.getElementById('results-section-panel');
    const filename = `${currentResultData.medicineName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;

    const opt = {
        margin:       10,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    showToastAlert('Generating PDF report...', 'info');

    // Using html2pdf CDN package
    html2pdf().from(element).set(opt).save()
        .then(() => showToastAlert('PDF downloaded successfully.', 'success'))
        .catch(err => {
            console.error('PDF generation failure:', err);
            showToastAlert('Failed to generate PDF document.', 'error');
        });
}

function shareReportUsingWebShare() {
    if (!currentResultData) return;

    if (navigator.share) {
        navigator.share({
            title: `Smart Health Report: ${currentResultData.medicineName}`,
            text: `Check out this AI analysis for "${currentResultData.medicineName}" (Generic: ${currentResultData.genericName})`,
            url: window.location.href
        })
        .then(() => showToastAlert('Report shared successfully.', 'success'))
        .catch(err => console.log('Share canceled or failed', err));
    } else {
        showToastAlert('Sharing is not supported on this browser/device.', 'warning');
    }
}

// --- LocalStorage Scan History System ---
function loadHistory() {
    const data = localStorage.getItem('sh_scan_history');
    historyList = data ? JSON.parse(data) : [];
    renderHistoryList();
}

function saveHistory() {
    localStorage.setItem('sh_scan_history', JSON.stringify(historyList));
}

function addToHistory(parsedData) {
    // Avoid duplicates by name
    historyList = historyList.filter(item => item.medicineName.toLowerCase() !== parsedData.medicineName.toLowerCase());
    
    // Push new item (we limit history size to 20)
    const newItem = {
        id: Date.now(),
        medicineName: parsedData.medicineName,
        genericName: parsedData.genericName,
        data: parsedData,
        isFavorite: false,
        timestamp: new Date().toISOString()
    };
    
    historyList.unshift(newItem);
    if (historyList.length > 20) historyList.pop();

    saveHistory();
    renderHistoryList();
}

function renderHistoryList(searchQuery = '', onlyFavorites = false) {
    const listContainer = document.getElementById('history-records-list');
    if (!listContainer) return;

    let filtered = historyList;

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
            item.medicineName.toLowerCase().includes(query) || 
            item.genericName.toLowerCase().includes(query)
        );
    }

    if (onlyFavorites) {
        filtered = filtered.filter(item => item.isFavorite);
    }

    if (filtered.length > 0) {
        listContainer.innerHTML = filtered.map(item => {
            const starSymbol = item.isFavorite ? '★' : '☆';
            const starClass = item.isFavorite ? 'active' : '';
            
            return `
                <li class="history-list-item">
                    <a href="#" onclick="loadHistoryItem(${item.id}); return false;" title="Click to view report">
                        💊 ${item.medicineName}
                        <span class="text-muted d-block" style="font-size:0.75rem;">${item.genericName}</span>
                    </a>
                    <button class="favorite-btn ${starClass}" onclick="toggleFavoriteStatus('${item.medicineName}', event)">${starSymbol}</button>
                </li>
            `;
        }).join('');
    } else {
        listContainer.innerHTML = '<p class="text-muted text-center py-4" style="font-size:0.9rem;">No matching history records.</p>';
    }
}

window.loadHistoryItem = function(id) {
    const item = historyList.find(i => i.id === id);
    if (item) {
        currentResultData = item.data;
        renderScanResults();
        
        // Populate canvas preview image placeholder if available
        document.getElementById('upload-zone-wrapper').style.display = 'none';
        document.getElementById('preview-img-element').src = item.data.path || 'assets/css/placeholder_med.png'; // default mock if image expired
        document.getElementById('image-preview-panel').style.display = 'block';
        document.getElementById('scan-submit-btn').removeAttribute('disabled');
        
        showToastAlert(`Loaded details for "${item.medicineName}"`, 'info');
    }
};

window.toggleFavoriteStatus = function(medName, event) {
    if (event) event.stopPropagation();

    const item = historyList.find(i => i.medicineName.toLowerCase() === medName.toLowerCase());
    if (item) {
        item.isFavorite = !item.isFavorite;
        saveHistory();
        
        // Refresh sidebar
        const searchInput = document.getElementById('search-history-input');
        const favBtn = document.getElementById('filter-favorites-btn');
        renderHistoryList(searchInput.value, favBtn.classList.contains('active'));
        
        // Sync star icon on current display
        if (currentResultData && currentResultData.medicineName.toLowerCase() === medName.toLowerCase()) {
            const star = document.getElementById('favorite-toggle-icon');
            if (star) star.textContent = item.isFavorite ? '⭐' : '☆';
        }
        
        showToastAlert(item.isFavorite ? 'Added to favorites.' : 'Removed from favorites.', 'success');
    }
};

function isFavorite(medName) {
    const item = historyList.find(i => i.medicineName.toLowerCase() === medName.toLowerCase());
    return item ? item.isFavorite : false;
}

function clearAllHistoryData() {
    if (confirm('Are you sure you want to clear your entire scan history?')) {
        historyList = [];
        saveHistory();
        renderHistoryList();
        showToastAlert('Scan history cleared.', 'success');
    }
}

// --- Toast alert popups system ---
function showToastAlert(message, type = 'info') {
    // Rely on global layout toast if loaded, else fallback to alert
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}
