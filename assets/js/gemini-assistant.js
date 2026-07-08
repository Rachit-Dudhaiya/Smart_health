/**
 * Smart Health - Gemini voice assistant
 * Prototype note: browser-side API keys are visible to users. Put Gemini calls
 * behind a backend proxy before deploying outside a demo or hackathon setting.
 */
(function () {
    const API_KEY_STORAGE = 'smart_health_gemini_key';
    const LLM_MODEL = 'llama-3.3-70b-versatile';
    const TTS_MODEL = 'bulbul:v3';
    const LLM_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
    const TTS_ENDPOINT = 'https://api.sarvam.ai/text-to-speech';
    const HISTORY_LIMIT = 8;

    const localeMap = {
        en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN', mr: 'mr-IN', pa: 'pa-IN',
        ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', kn: 'kn-IN', ml: 'ml-IN', ur: 'ur-IN'
    };

    const languageNames = {
        en: 'English', hi: 'Hindi', gu: 'Gujarati', mr: 'Marathi', pa: 'Punjabi',
        ta: 'Tamil', te: 'Telugu', bn: 'Bengali', kn: 'Kannada', ml: 'Malayalam', ur: 'Urdu'
    };

    const navTargets = [
        { keys: ['medicine', 'stock', 'dawa', 'tablet'], path: 'pages/medicine-stock.html', label: 'medicine stock' },
        { keys: ['bed', 'icu', 'ward', 'vacancy'], path: 'pages/bed-availability.html', label: 'bed availability' },
        { keys: ['doctor available', 'doctor availability', 'appointment', 'specialist'], path: 'pages/doctor-availability.html', label: 'doctor availability' },
        { keys: ['doctor attendance', 'attendance', 'roster'], path: 'pages/doctor-attendance.html', label: 'doctor attendance' },
        { keys: ['queue', 'wait', 'patient flow', 'rush'], path: 'pages/patient-flow.html', label: 'patient flow' },
        { keys: ['ambulance', 'emergency', 'sos'], path: 'pages/ambulance-tracker.html', label: 'ambulance tracking' },
        { keys: ['login', 'sign in'], path: 'pages/auth/login.html', label: 'login' },
        { keys: ['register', 'signup', 'sign up'], path: 'pages/auth/register.html', label: 'registration' }
    ];

    let state = {
        initialized: false,
        open: false,
        listening: false,
        busy: false,
        history: [],
        recognition: null,
        audio: null,
        pathPrefix: './'
    };

    window.initGeminiAssistant = function initGeminiAssistant(options = {}) {
        if (state.initialized || document.getElementById('gemini-assistant-root')) return;
        state.initialized = true;
        state.pathPrefix = options.pathPrefix || document.body.getAttribute('data-path-prefix') || './';
        injectAssistant();
        bindEvents();
        addMessage('assistant', greetingForCurrentLanguage());
    };

    function injectAssistant() {
        const root = document.createElement('div');
        root.id = 'gemini-assistant-root';
        root.className = 'gemini-assistant';
        root.innerHTML = `
            <button type="button" class="gemini-fab" id="gemini-fab" aria-label="Open AI voice assistant">
                <span class="material-icons notranslate" aria-hidden="true">record_voice_over</span>
            </button>
            <section class="gemini-panel" id="gemini-panel" aria-label="AI voice assistant" aria-hidden="true" style="display: none !important;">
                <div class="gemini-header">
                    <div><strong>AI Voice Help</strong><span>Groq + Sarvam AI</span></div>
                    <button type="button" class="gemini-icon-btn" id="gemini-close" aria-label="Close assistant"><span class="material-icons notranslate" aria-hidden="true">close</span></button>
                </div>
                <div class="gemini-key-row" id="gemini-key-row">
                    <input id="gemini-key-input" type="password" autocomplete="off" placeholder="Paste API key for this browser" />
                    <button type="button" class="gemini-save-key" id="gemini-save-key">Save</button>
                </div>
                <div class="gemini-messages" id="gemini-messages" aria-live="polite"></div>
                <form class="gemini-form" id="gemini-form">
                    <textarea id="gemini-input" rows="2" placeholder="Ask in your language. Example: beds available?"></textarea>
                    <div class="gemini-actions">
                        <button type="button" class="gemini-action-btn" id="gemini-mic" aria-label="Speak question"><span class="material-icons notranslate" aria-hidden="true">mic</span><span>Speak</span></button>
                        <button type="submit" class="gemini-action-btn gemini-send" id="gemini-send"><span class="material-icons notranslate" aria-hidden="true">send</span><span>Ask</span></button>
                    </div>
                </form>
                <div class="gemini-footer">
                    <label><input type="checkbox" id="gemini-tts-toggle" checked /> AI voice</label>
                    <button type="button" id="gemini-stop-audio">Stop audio</button>
                </div>
            </section>`;
        document.body.appendChild(root);
        updateKeyRow();
    }

    function bindEvents() {
        document.getElementById('gemini-fab')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePanel();
        });
        document.getElementById('gemini-close')?.addEventListener('click', closePanel);
        document.getElementById('gemini-save-key')?.addEventListener('click', saveApiKey);
        document.getElementById('gemini-mic')?.addEventListener('click', toggleListening);
        document.getElementById('gemini-stop-audio')?.addEventListener('click', stopAudio);
        document.getElementById('gemini-form')?.addEventListener('submit', (event) => {
            event.preventDefault();
            const input = document.getElementById('gemini-input');
            const value = input.value.trim();
            if (!value) return;
            input.value = '';
            handleQuestion(value);
        });
    }

    function togglePanel() {
        state.open = !state.open;
        const panel = document.getElementById('gemini-panel');
        if (!panel) return;
        
        if (state.open) {
            panel.style.setProperty('display', 'grid', 'important');
            panel.setAttribute('aria-hidden', 'false');
            document.getElementById('gemini-input')?.focus();
        } else {
            panel.style.setProperty('display', 'none', 'important');
            panel.setAttribute('aria-hidden', 'true');
        }
    }

    function closePanel() {
        state.open = false;
        const panel = document.getElementById('gemini-panel');
        if (!panel) return;
        panel.style.setProperty('display', 'none', 'important');
        panel.setAttribute('aria-hidden', 'true');
    }

    function saveApiKey() {
        const value = document.getElementById('gemini-key-input')?.value.trim();
        if (!value) {
            notify('Please paste an API key first.', 'warning');
            return;
        }
        localStorage.setItem(API_KEY_STORAGE, value);
        document.getElementById('gemini-key-input').value = '';
        updateKeyRow();
        notify('API key saved in this browser.', 'success');
    }

    function updateKeyRow() {
        const row = document.getElementById('gemini-key-row');
        if (!row) return;
        row.style.display = getApiKey() ? 'none' : 'grid';
    }

    async function handleQuestion(question) {
        if (state.busy) return;
        addMessage('user', question);

        const target = detectNavigation(question);
        if (target) {
            const response = `Opening ${target.label}. You can ask again if you need help reading this page.`;
            addMessage('assistant', response);
            speakAssistantResponse(response);
            setTimeout(() => { window.location.href = resolvePath(target.path); }, 900);
            return;
        }

        const groqKey = window.SMART_HEALTH_GROQ_API_KEY;
        if (!groqKey) {
            const response = 'Please set your Groq API key first in the configuration.';
            addMessage('assistant', response);
            speakBrowser(response);
            return;
        }

        state.busy = true;
        setBusy(true);
        try {
            const answer = await askLLM(question, groqKey);
            addMessage('assistant', answer);
            await speakAssistantResponse(answer);
        } catch (error) {
            console.error(error);
            const fallback = 'I could not reach the AI service right now. Please check the network connection.';
            addMessage('assistant', fallback);
            speakBrowser(fallback);
        } finally {
            state.busy = false;
            setBusy(false);
        }
    }

    async function askLLM(question, key) {
        const context = buildHealthContext();
        const lang = window.currentLanguage || 'en';
        
        const historyMessages = state.history.slice(-HISTORY_LIMIT).map(item => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: item.text
        }));

        const prompt = `You are Smart Health's voice assistant for PHC/CHC patients, senior citizens, doctors, pharmacists, and admins.
Reply in ${languageNames[lang] || 'the user selected language'} when possible. Use simple words, short sentences, and a reassuring tone.
Do not provide diagnosis. For medical emergencies, tell the user to call 108 or use Emergency SOS.
Use only the app context below for live stock, beds, queues, rosters, and navigation.

APP CONTEXT:
${context}`;

        const messages = [
            { role: 'system', content: prompt },
            ...historyMessages,
            { role: 'user', content: question }
        ];

        const response = await fetch(LLM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: messages,
                temperature: 0.4,
                max_tokens: 320
            })
        });
        if (!response.ok) throw new Error(`LLM text error ${response.status}: ${await response.text()}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'I am sorry, I could not prepare an answer.';
    }

    async function speakAssistantResponse(text) {
        const key = window.SMART_HEALTH_SARVAM_API_KEY;
        const useAiVoice = document.getElementById('gemini-tts-toggle')?.checked;
        if (key && useAiVoice) {
            try {
                await speakSarvamTts(text, key);
                return;
            } catch (error) {
                console.warn('Sarvam TTS fallback:', error);
            }
        }
        speakBrowser(text);
    }

    async function speakSarvamTts(text, key) {
        stopAudio();
        const lang = window.currentLanguage || 'en';
        const targetLang = localeMap[lang] || 'en-IN';
        
        const response = await fetch(TTS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-subscription-key': key },
            body: JSON.stringify({
                inputs: [text],
                target_language_code: targetLang,
                speaker: 'shreya',
                model: TTS_MODEL,
                pitch: 0,
                pace: 1.0,
                loudness: 1.0
            })
        });
        if (!response.ok) throw new Error(`Sarvam TTS error ${response.status}: ${await response.text()}`);
        const data = await response.json();
        const base64Audio = data.audios?.[0];
        if (!base64Audio) throw new Error('No audio block found in Sarvam TTS response.');
        
        state.audio = new Audio("data:audio/wav;base64," + base64Audio);
        state.audio.onended = () => { state.audio = null; };
        await state.audio.play();
    }

    function toggleListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            notify('Speech recognition requires Chrome/Edge and a secure HTTPS connection. Typing is still available.', 'error');
            return;
        }
        if (state.listening && state.recognition) {
            state.recognition.stop();
            return;
        }
        const recognition = new SpeechRecognition();
        state.recognition = recognition;
        recognition.lang = localeMap[window.currentLanguage || 'en'] || 'en-IN';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.onstart = () => {
            state.listening = true;
            document.getElementById('gemini-mic')?.classList.add('listening');
        };
        recognition.onend = () => {
            state.listening = false;
            document.getElementById('gemini-mic')?.classList.remove('listening');
        };
        recognition.onerror = () => notify('Could not hear clearly. Please try again.', 'warning');
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim();
            document.getElementById('gemini-input').value = transcript;
            if (event.results[event.results.length - 1].isFinal && transcript) {
                recognition.stop();
                document.getElementById('gemini-input').value = '';
                handleQuestion(transcript);
            }
        };
        recognition.start();
    }

    function buildHealthContext() {
        if (!window.db) return 'Database is not loaded yet.';
        const user = window.db.getCurrentUser();
        const metrics = window.db.getLiveMetrics();
        const medicines = window.db.getMedicines();
        const beds = window.db.getBeds();
        const doctors = window.db.getUsers().filter(userItem => userItem.role === 'doctor' && userItem.status === 'active');
        const schedules = window.db.getDoctorSchedules();
        const lowMedicines = medicines.filter(item => ['low', 'critical', 'expired'].includes(item.status)).map(item => `${item.name}: ${item.stock} units, ${item.status}`).join('; ') || 'No critical medicine alerts';
        const bedText = beds.map(item => `${item.ward_type}: ${Math.max(item.total - item.occupied, 0)} free of ${item.total}`).join('; ');
        const doctorText = doctors.map(item => item.name).join(', ') || 'No active doctors';
        const scheduleText = schedules.slice(0, 4).map(item => `doctor ${item.doctor_id} ${item.available_date} ${item.start_time}-${item.end_time} ${item.status}`).join('; ') || 'No published schedules';
        return [
            `Current page: ${document.title}`,
            `Signed-in user: ${user ? `${user.name} (${user.role})` : 'Guest'}`,
            `Available beds total: ${metrics.availableBeds}`,
            `Low stock alerts: ${metrics.lowStockCount}`,
            `Doctor roster rate: ${metrics.attendanceRate}%`,
            `Medicine alerts: ${lowMedicines}`,
            `Beds: ${bedText}`,
            `Active doctors: ${doctorText}`,
            `Doctor schedules: ${scheduleText}`,
            'Important pages: medicine stock, bed availability, patient flow, doctor availability, ambulance tracker, login, register.'
        ].join('\n');
    }

    function detectNavigation(question) {
        const text = question.toLowerCase();
        if (!/\b(open|show|go|take|navigate|check|where|khol|dikha)\b/.test(text)) return null;
        return navTargets.find(target => target.keys.some(key => text.includes(key))) || null;
    }

    function addMessage(role, text) {
        state.history.push({ role, text });
        const messages = document.getElementById('gemini-messages');
        if (!messages) return;
        const item = document.createElement('div');
        item.className = `gemini-message ${role}`;
        item.textContent = text;
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    }

    function extractText(data) {
        return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    }

    function findAudioData(value) {
        if (!value || typeof value !== 'object') return '';
        if (typeof value.data === 'string' && (value.type === 'audio' || value.mime_type || value.mimeType)) return value.data;
        for (const key of Object.keys(value)) {
            const found = findAudioData(value[key]);
            if (found) return found;
        }
        return '';
    }

    function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function pcmToWav(pcmBytes, sampleRate, channels, bitDepth) {
        const headerSize = 44;
        const wav = new ArrayBuffer(headerSize + pcmBytes.length);
        const view = new DataView(wav);
        const writeString = (offset, value) => {
            for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + pcmBytes.length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * channels * (bitDepth / 8), true);
        view.setUint16(32, channels * (bitDepth / 8), true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, pcmBytes.length, true);
        new Uint8Array(wav, headerSize).set(pcmBytes);
        return wav;
    }

    function speakBrowser(text) {
        if (typeof window.speakText === 'function') {
            window.speakText(text, window.currentLanguage || 'en');
            return;
        }
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = localeMap[window.currentLanguage || 'en'] || 'en-IN';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }

    function stopAudio() {
        if (state.audio) {
            state.audio.pause();
            state.audio.currentTime = 0;
            state.audio = null;
        }
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }

    function setBusy(isBusy) {
        const send = document.getElementById('gemini-send');
        const input = document.getElementById('gemini-input');
        if (send) send.disabled = isBusy;
        if (input) input.disabled = isBusy;
    }

    function getApiKey() {
        return window.SMART_HEALTH_GEMINI_API_KEY || localStorage.getItem(API_KEY_STORAGE) || '';
    }

    function resolvePath(path) {
        if (state.pathPrefix === './') return path;
        return `${state.pathPrefix}${path}`;
    }

    function greetingForCurrentLanguage() {
        const lang = window.currentLanguage || 'en';
        if (lang === 'hi') return 'Namaste. Aap bolkar ya likhkar dawa, bed, doctor, queue, ya ambulance ki madad le sakte hain.';
        return 'Hello. You can speak or type to check medicines, beds, doctors, queues, or ambulance help.';
    }

    function notify(message, type) {
        if (window.showToast) window.showToast(message, type);
    }
})();
