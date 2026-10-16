/**
 * AI Resume Analyzer Client Application
 * Handles file uploads, sample presets, REST requests, Chart.js radar charts,
 * batch recruiter leaderboard, and AI interactive tools.
 */

// Application State
const state = {
    mode: 'single', // 'single' or 'recruiter'
    resumeFile: null,
    resumeText: '',
    jdFile: null,
    jdText: '',
    batchFiles: [],
    lastAnalysis: null,
    lastBatchResults: null,
    samples: null,
    chartInstance: null
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    initLucide();
    initEventListeners();
    fetchSamples();
});

function initLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Fetch Sample Library for 1-Click Demos
async function fetchSamples() {
    try {
        const res = await fetch('/api/samples');
        if (res.ok) {
            state.samples = await res.json();
        }
    } catch (e) {
        console.warn('Could not load samples', e);
    }
}

// Event Listeners
function initEventListeners() {
    // Mode Switcher
    const singleTab = document.getElementById('singleModeTab');
    const recruiterTab = document.getElementById('recruiterModeTab');
    
    singleTab?.addEventListener('click', () => switchMode('single'));
    recruiterTab?.addEventListener('click', () => switchMode('recruiter'));

    // Resume Input Toggle (File vs Paste)
    document.getElementById('resumeToggleFile')?.addEventListener('click', () => setResumeInputType('file'));
    document.getElementById('resumeTogglePaste')?.addEventListener('click', () => setResumeInputType('paste'));

    // JD Input Toggle (Paste vs File)
    document.getElementById('jdTogglePaste')?.addEventListener('click', () => setJDInputType('paste'));
    document.getElementById('jdToggleFile')?.addEventListener('click', () => setJDInputType('file'));

    // Drag and Drop: Single Resume
    setupDropZone('resumeDropZone', 'resumeFileInput', handleResumeFileSelect);
    // Drag and Drop: JD
    setupDropZone('jdDropZone', 'jdFileInput', handleJDFileSelect);
    // Drag and Drop: Batch Resumes
    setupDropZone('batchDropZone', 'batchFileInput', handleBatchFilesSelect);

    // Analyze Buttons
    document.getElementById('btnAnalyzeSingle')?.addEventListener('click', runSingleAnalysis);
    document.getElementById('btnAnalyzeBatch')?.addEventListener('click', runBatchAnalysis);

    // Sample Preset Dropdown
    document.getElementById('sampleSelector')?.addEventListener('change', loadSelectedSample);

    // AI Bullet Enhancer
    document.getElementById('btnEnhanceBullet')?.addEventListener('click', handleEnhanceBullet);

    // AI Interview Prep
    document.getElementById('btnGenInterview')?.addEventListener('click', handleGenInterviewPrep);

    // PDF Export
    document.getElementById('btnDownloadPDF')?.addEventListener('click', downloadCurrentReportPDF);

    // Copy Missing Skills
    document.getElementById('btnCopyMissingSkills')?.addEventListener('click', copyMissingSkillsToClipboard);

    // Batch Table Filter Search
    document.getElementById('batchSearchInput')?.addEventListener('input', filterBatchLeaderboard);
}

// Mode Switcher
function switchMode(newMode) {
    state.mode = newMode;
    const singleTab = document.getElementById('singleModeTab');
    const recruiterTab = document.getElementById('recruiterModeTab');
    const singleInputs = document.getElementById('singleInputsContainer');
    const recruiterInputs = document.getElementById('recruiterInputsContainer');
    const singleResults = document.getElementById('singleResultsSection');
    const recruiterResults = document.getElementById('recruiterResultsSection');

    if (newMode === 'single') {
        singleTab.className = 'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm bg-blue-600 text-white';
        recruiterTab.className = 'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100';
        singleInputs.classList.remove('hidden');
        recruiterInputs.classList.add('hidden');
        if (state.lastAnalysis) singleResults.classList.remove('hidden');
        recruiterResults.classList.add('hidden');
    } else {
        recruiterTab.className = 'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm bg-blue-600 text-white';
        singleTab.className = 'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100';
        singleInputs.classList.add('hidden');
        recruiterInputs.classList.remove('hidden');
        singleResults.classList.add('hidden');
        if (state.lastBatchResults) recruiterResults.classList.remove('hidden');
    }
    initLucide();
}

function setResumeInputType(type) {
    const fileArea = document.getElementById('resumeFileArea');
    const pasteArea = document.getElementById('resumePasteArea');
    const btnFile = document.getElementById('resumeToggleFile');
    const btnPaste = document.getElementById('resumeTogglePaste');

    if (type === 'file') {
        fileArea.classList.remove('hidden');
        pasteArea.classList.add('hidden');
        btnFile.classList.add('bg-white', 'shadow-xs', 'text-blue-600');
        btnFile.classList.remove('text-slate-500');
        btnPaste.classList.remove('bg-white', 'shadow-xs', 'text-blue-600');
        btnPaste.classList.add('text-slate-500');
    } else {
        fileArea.classList.add('hidden');
        pasteArea.classList.remove('hidden');
        btnPaste.classList.add('bg-white', 'shadow-xs', 'text-blue-600');
        btnPaste.classList.remove('text-slate-500');
        btnFile.classList.remove('bg-white', 'shadow-xs', 'text-blue-600');
        btnFile.classList.add('text-slate-500');
    }
}

function setJDInputType(type) {
    const fileArea = document.getElementById('jdFileArea');
    const pasteArea = document.getElementById('jdPasteArea');
    const btnPaste = document.getElementById('jdTogglePaste');
    const btnFile = document.getElementById('jdToggleFile');

    if (type === 'paste') {
        pasteArea.classList.remove('hidden');
        fileArea.classList.add('hidden');
        btnPaste.classList.add('bg-white', 'shadow-xs', 'text-blue-600');
        btnPaste.classList.remove('text-slate-500');
        btnFile.classList.remove('bg-white', 'shadow-xs', 'text-blue-600');
        btnFile.classList.add('text-slate-500');
    } else {
        pasteArea.classList.add('hidden');
        fileArea.classList.remove('hidden');
        btnFile.classList.add('bg-white', 'shadow-xs', 'text-blue-600');
        btnFile.classList.remove('text-slate-500');
        btnPaste.classList.remove('bg-white', 'shadow-xs', 'text-blue-600');
        btnPaste.classList.add('text-slate-500');
    }
}

// Drag & Drop Setup
function setupDropZone(zoneId, inputId, callback) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-active');
    });

    ['dragleave', 'dragend'].forEach(evt => {
        zone.addEventListener(evt, () => zone.classList.remove('drag-active'));
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-active');
        if (e.dataTransfer.files.length) {
            callback(e.dataTransfer.files);
        }
    });

    input.addEventListener('change', () => {
        if (input.files.length) {
            callback(input.files);
        }
    });
}

function handleResumeFileSelect(files) {
    const file = files[0];
    if (!file) return;
    state.resumeFile = file;
    document.getElementById('resumeFileName').textContent = file.name;
    document.getElementById('resumeFileSelected').classList.remove('hidden');
    document.getElementById('resumeDropContent').classList.add('hidden');
}

function handleJDFileSelect(files) {
    const file = files[0];
    if (!file) return;
    state.jdFile = file;
    document.getElementById('jdFileName').textContent = file.name;
    document.getElementById('jdFileSelected').classList.remove('hidden');
    document.getElementById('jdDropContent').classList.add('hidden');
}

function handleBatchFilesSelect(files) {
    state.batchFiles = Array.from(files);
    const container = document.getElementById('batchFilesList');
    container.innerHTML = '';
    
    document.getElementById('batchCountBadge').textContent = `${state.batchFiles.length} Resumes Ready`;
    document.getElementById('batchCountBadge').classList.remove('hidden');

    state.batchFiles.slice(0, 8).forEach(file => {
        const item = document.createElement('div');
        item.className = 'text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 flex items-center gap-1.5';
        item.innerHTML = `<i data-lucide="file-text" class="w-3.5 h-3.5"></i> <span class="truncate max-w-[150px]">${file.name}</span>`;
        container.appendChild(item);
    });
    if (state.batchFiles.length > 8) {
        const more = document.createElement('span');
        more.className = 'text-xs text-slate-500 self-center';
        more.textContent = `+${state.batchFiles.length - 8} more`;
        container.appendChild(more);
    }
    initLucide();
}

// Sample Loader
function loadSelectedSample(e) {
    const selectedKey = e.target.value;
    if (!selectedKey || !state.samples) return;

    if (selectedKey === 'fullstack_alex') {
        const jd = state.samples.job_descriptions['senior_fullstack_engineer']?.content;
        const res = state.samples.resumes['alex_turner_fullstack']?.content;
        if (jd && res) {
            setJDInputType('paste');
            setResumeInputType('paste');
            document.getElementById('jdTextArea').value = jd;
            document.getElementById('resumeTextArea').value = res;
        }
    } else if (selectedKey === 'datascience_sarah') {
        const jd = state.samples.job_descriptions['lead_data_scientist']?.content;
        const res = state.samples.resumes['sarah_chen_datascience']?.content;
        if (jd && res) {
            setJDInputType('paste');
            setResumeInputType('paste');
            document.getElementById('jdTextArea').value = jd;
            document.getElementById('resumeTextArea').value = res;
        }
    } else if (selectedKey === 'devops_marcus') {
        const jd = state.samples.job_descriptions['devops_cloud_architect']?.content;
        const res = state.samples.resumes['marcus_vance_devops']?.content;
        if (jd && res) {
            setJDInputType('paste');
            setResumeInputType('paste');
            document.getElementById('jdTextArea').value = jd;
            document.getElementById('resumeTextArea').value = res;
        }
    } else if (selectedKey === 'junior_gap_test') {
        const jd = state.samples.job_descriptions['senior_fullstack_engineer']?.content;
        const res = state.samples.resumes['jordan_lee_junior_dev']?.content;
        if (jd && res) {
            setJDInputType('paste');
            setResumeInputType('paste');
            document.getElementById('jdTextArea').value = jd;
            document.getElementById('resumeTextArea').value = res;
        }
    }
}

// Run Single Resume Analysis
async function runSingleAnalysis() {
    const btn = document.getElementById('btnAnalyzeSingle');
    const spinner = document.getElementById('analyzeSpinner');
    const btnText = document.getElementById('analyzeBtnText');

    // Build FormData
    const formData = new FormData();
    
    // Resume
    const isFileTab = !document.getElementById('resumeFileArea').classList.contains('hidden');
    if (isFileTab && state.resumeFile) {
        formData.append('resume_file', state.resumeFile);
    } else {
        const text = document.getElementById('resumeTextArea').value.trim();
        if (!text) {
            alert('Please select a resume file or paste resume text.');
            return;
        }
        formData.append('resume_text', text);
    }

    // JD
    const isJdFileTab = !document.getElementById('jdFileArea').classList.contains('hidden');
    if (isJdFileTab && state.jdFile) {
        formData.append('jd_file', state.jdFile);
    } else {
        const jdText = document.getElementById('jdTextArea').value.trim();
        if (!jdText) {
            alert('Please provide a job description (paste or upload).');
            return;
        }
        formData.append('jd_text', jdText);
    }

    // Loading State
    btn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'Analyzing Resume & JD...';

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Analysis failed.');
        }

        const data = await res.json();
        state.lastAnalysis = data;
        renderSingleResults(data);

        // Smooth scroll to results
        document.getElementById('singleResultsSection').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Match & Analyze Candidate';
    }
}

// Render Single Analysis Dashboard
function renderSingleResults(data) {
    const resultsSec = document.getElementById('singleResultsSection');
    resultsSec.classList.remove('hidden');

    // Hero Overview
    document.getElementById('resCandidateName').textContent = data.candidate_name || 'Candidate';
    document.getElementById('resFileName').textContent = data.filename || 'Resume';
    document.getElementById('resVerdict').textContent = data.verdict;
    document.getElementById('resFitTier').textContent = data.fit_tier;

    // Badge Color
    const tierBadge = document.getElementById('resFitTierBadge');
    tierBadge.className = `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        data.fit_tier === 'Exceptional Match' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
        data.fit_tier === 'Strong Match' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
        data.fit_tier === 'Moderate Match' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
        'bg-rose-100 text-rose-800 border border-rose-200'
    }`;

    // Circular Score Gauge
    animateGauge(data.overall_score);

    // Breakdown Cards
    const sc = data.scores || {};
    document.getElementById('scoreSkills').textContent = `${sc.skills_score}%`;
    document.getElementById('scoreSemantic').textContent = `${sc.semantic_score}%`;
    document.getElementById('scoreExp').textContent = `${sc.experience_score}%`;
    document.getElementById('scoreATS').textContent = `${sc.ats_formatting_score}%`;

    // Candidate Details
    const ats = data.ats_metrics || {};
    const contact = ats.contact || {};
    document.getElementById('metaEmail').textContent = contact.email || 'Not detected';
    document.getElementById('metaPhone').textContent = contact.phone || 'Not detected';
    
    const linksEl = document.getElementById('metaLinks');
    linksEl.innerHTML = '';
    if (contact.linkedin) {
        linksEl.innerHTML += `<a href="${contact.linkedin}" target="_blank" class="text-blue-600 hover:underline inline-flex items-center gap-1 mr-3"><i data-lucide="linkedin" class="w-3.5 h-3.5"></i> LinkedIn</a>`;
    }
    if (contact.github) {
        linksEl.innerHTML += `<a href="${contact.github}" target="_blank" class="text-slate-800 hover:underline inline-flex items-center gap-1"><i data-lucide="github" class="w-3.5 h-3.5"></i> GitHub</a>`;
    }
    if (!contact.linkedin && !contact.github) {
        linksEl.textContent = 'None detected';
    }

    const exp = data.experience_analysis || {};
    document.getElementById('metaExpYears').textContent = `${exp.candidate_years} years (Job asks ~${exp.required_years} yrs)`;
    document.getElementById('metaSeniority').textContent = `${exp.candidate_seniority} (Target: ${exp.required_seniority})`;

    // ATS Readability Metrics
    document.getElementById('metaWordCount').textContent = ats.word_count || 0;
    document.getElementById('metaActionVerbs').textContent = ats.action_verbs_count || 0;
    document.getElementById('metaMetricsCount').textContent = ats.metrics_count || 0;

    // Render Radar Chart
    renderRadarChart(sc);

    // Render Skills Audit
    renderSkillsAudit(data.skills_analysis);

    // Render Actionable Suggestions
    renderSuggestions(data.suggestions);

    initLucide();
}

function animateGauge(score) {
    const circle = document.getElementById('scoreCircle');
    const scoreText = document.getElementById('overallScoreText');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Color gradient
    if (score >= 80) circle.style.stroke = '#10b981'; // emerald
    else if (score >= 65) circle.style.stroke = '#3b82f6'; // blue
    else if (score >= 50) circle.style.stroke = '#f59e0b'; // amber
    else circle.style.stroke = '#ef4444'; // rose

    // Count up animation
    let current = 0;
    const step = score / 35;
    const interval = setInterval(() => {
        current += step;
        if (current >= score) {
            current = score;
            clearInterval(interval);
        }
        scoreText.textContent = `${Math.round(current)}%`;
    }, 20);
}

function renderRadarChart(scores) {
    const ctx = document.getElementById('radarChartCanvas');
    if (!ctx) return;

    if (state.chartInstance) {
        state.chartInstance.destroy();
    }

    state.chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Tech Skills', 'Semantic Fit', 'Experience', 'ATS Structure', 'Action Impact'],
            datasets: [{
                label: 'Candidate Match Profile',
                data: [
                    scores.skills_score || 0,
                    scores.semantic_score || 0,
                    scores.experience_score || 0,
                    scores.ats_formatting_score || 0,
                    Math.min(100, (scores.skills_score + scores.ats_formatting_score) / 2)
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 0.9)',
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#2563eb',
                borderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(226, 232, 240, 0.8)' },
                    grid: { color: 'rgba(226, 232, 240, 0.8)' },
                    pointLabels: {
                        font: { size: 11, family: "'Plus Jakarta Sans', sans-serif", weight: '600' },
                        color: '#475569'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: { display: false, stepSize: 20 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderSkillsAudit(skills) {
    const critContainer = document.getElementById('criticalMissingContainer');
    const allMissingContainer = document.getElementById('allMissingContainer');
    const matchedContainer = document.getElementById('matchedSkillsContainer');
    const extraContainer = document.getElementById('extraSkillsContainer');

    // Counts
    document.getElementById('critMissingCount').textContent = skills.critical_missing_skills?.length || 0;
    document.getElementById('allMissingCount').textContent = skills.missing_count || 0;
    document.getElementById('matchedCount').textContent = skills.matched_count || 0;

    // Critical Missing
    critContainer.innerHTML = '';
    const critList = skills.critical_missing_skills || [];
    if (critList.length === 0) {
        critContainer.innerHTML = '<span class="text-xs text-emerald-600 font-medium">None! All high-priority JD skills matched.</span>';
    } else {
        critList.forEach(skill => {
            const pill = document.createElement('span');
            pill.className = 'inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold shadow-2xs hover:bg-rose-100 transition-colors';
            pill.innerHTML = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-500"></i> ${skill}`;
            critContainer.appendChild(pill);
        });
    }

    // All Missing
    allMissingContainer.innerHTML = '';
    const allMiss = skills.missing_skills || [];
    if (allMiss.length === 0) {
        allMissingContainer.innerHTML = '<span class="text-xs text-slate-400">Zero missing skills detected.</span>';
    } else {
        allMiss.forEach(skill => {
            const pill = document.createElement('span');
            pill.className = 'inline-flex items-center px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-md text-xs font-medium';
            pill.textContent = skill;
            allMissingContainer.appendChild(pill);
        });
    }

    // Matched Skills
    matchedContainer.innerHTML = '';
    const matched = skills.matched_skills || [];
    matched.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium shadow-2xs';
        pill.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-500"></i> ${skill}`;
        matchedContainer.appendChild(pill);
    });

    // Extra candidate skills
    extraContainer.innerHTML = '';
    const extra = skills.extra_skills || [];
    extra.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs';
        pill.textContent = skill;
        extraContainer.appendChild(pill);
    });
}

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsContainer');
    container.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = '<div class="text-sm text-slate-500">No major optimization issues detected. Excellent resume alignment!</div>';
        return;
    }

    suggestions.forEach(item => {
        const borderCol = item.type === 'critical' ? 'border-rose-400 bg-rose-50/50' :
                          item.type === 'warning' ? 'border-amber-400 bg-amber-50/50' : 'border-blue-400 bg-blue-50/50';
        const iconCol = item.type === 'critical' ? 'text-rose-600' :
                        item.type === 'warning' ? 'text-amber-600' : 'text-blue-600';

        const div = document.createElement('div');
        div.className = `p-4 rounded-xl border-l-4 border ${borderCol} flex gap-3.5 shadow-2xs`;
        div.innerHTML = `
            <div class="${iconCol} mt-0.5">
                <i data-lucide="${item.icon || 'info'}" class="w-5 h-5"></i>
            </div>
            <div>
                <h4 class="text-sm font-bold text-slate-900">${item.title}</h4>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">${item.message}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// Copy Missing Skills to Clipboard
function copyMissingSkillsToClipboard() {
    if (!state.lastAnalysis) return;
    const missing = state.lastAnalysis.skills_analysis.missing_skills || [];
    if (missing.length === 0) {
        alert('No missing skills to copy!');
        return;
    }
    navigator.clipboard.writeText(missing.join(', ')).then(() => {
        const btn = document.getElementById('btnCopyMissingSkills');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Copied!`;
        initLucide();
        setTimeout(() => {
            btn.innerHTML = originalText;
            initLucide();
        }, 2000);
    });
}

// AI Bullet Enhancer
async function handleEnhanceBullet() {
    const input = document.getElementById('inputBulletText').value.trim();
    const skill = document.getElementById('inputBulletSkill').value.trim();
    const resultsContainer = document.getElementById('bulletVariationsContainer');

    if (!input) {
        alert('Please enter a resume bullet point to optimize.');
        return;
    }

    const btn = document.getElementById('btnEnhanceBullet');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Rewriting...`;
    initLucide();

    try {
        const res = await fetch('/api/ai/enhance-bullet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bullet: input, target_skill: skill })
        });
        const data = await res.json();
        
        resultsContainer.innerHTML = '';
        data.variations.forEach((varText, idx) => {
            const card = document.createElement('div');
            card.className = 'p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-blue-400 transition-colors group relative';
            card.innerHTML = `
                <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-bold text-blue-700">Formula Option ${idx + 1}</span>
                    <button class="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium copy-btn">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy
                    </button>
                </div>
                <p class="text-xs text-slate-700 leading-relaxed">${varText}</p>
            `;
            // Copy click handler
            card.querySelector('.copy-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(varText);
                card.querySelector('.copy-btn').innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Copied`;
                initLucide();
            });
            resultsContainer.appendChild(card);
        });
        resultsContainer.classList.remove('hidden');
        initLucide();
    } catch (e) {
        alert('Failed to optimize bullet.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4"></i> Optimize Bullet Point`;
        initLucide();
    }
}

// AI Interview Prep
async function handleGenInterviewPrep() {
    if (!state.lastAnalysis) return;
    const btn = document.getElementById('btnGenInterview');
    const container = document.getElementById('interviewQuestionsList');
    
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Generating tailored questions...`;
    initLucide();

    try {
        const res = await fetch('/api/ai/interview-prep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matched_skills: state.lastAnalysis.skills_analysis.matched_skills,
                missing_skills: state.lastAnalysis.skills_analysis.missing_skills,
                candidate_name: state.lastAnalysis.candidate_name
            })
        });
        const data = await res.json();
        
        container.innerHTML = '';
        data.questions.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'p-3.5 bg-slate-50 border border-slate-200 rounded-lg';
            item.innerHTML = `
                <div class="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">${q.category}</div>
                <div class="text-xs font-semibold text-slate-900 mb-1.5 leading-snug">Q${idx + 1}: ${q.question}</div>
                <div class="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-100 flex items-start gap-1.5">
                    <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5"></i>
                    <span><b>Candidate Prep Tip:</b> ${q.tip}</span>
                </div>
            `;
            container.appendChild(item);
        });
        container.classList.remove('hidden');
        initLucide();
    } catch (e) {
        alert('Failed to generate interview questions.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="message-square" class="w-4 h-4"></i> Generate Interview Questions`;
        initLucide();
    }
}

// Download PDF Report
async function downloadCurrentReportPDF() {
    if (!state.lastAnalysis) return;
    const btn = document.getElementById('btnDownloadPDF');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Building PDF...`;
    initLucide();

    try {
        const res = await fetch('/api/export-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis: state.lastAnalysis })
        });
        if (!res.ok) throw new Error('PDF generation failed');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cand = (state.lastAnalysis.candidate_name || 'candidate').replace(/\s+/g, '_');
        a.download = `Resume_Analysis_${cand}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        alert('Failed to download PDF report.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> Download PDF Report`;
        initLucide();
    }
}

// Run Batch Recruiter Analysis
async function runBatchAnalysis() {
    if (!state.batchFiles || state.batchFiles.length === 0) {
        alert('Please select or drop multiple resume files.');
        return;
    }

    const jdText = document.getElementById('batchJDTextArea').value.trim();
    if (!jdText) {
        alert('Please provide a Job Description to rank candidates against.');
        return;
    }

    const btn = document.getElementById('btnAnalyzeBatch');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Ranking ${state.batchFiles.length} Candidates...`;
    initLucide();

    const formData = new FormData();
    state.batchFiles.forEach(file => {
        formData.append('resumes', file);
    });
    formData.append('jd_text', jdText);

    try {
        const res = await fetch('/api/batch-analyze', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Batch analysis failed');
        const data = await res.json();
        state.lastBatchResults = data.candidates;

        renderBatchLeaderboard(data.candidates);
        document.getElementById('recruiterResultsSection').classList.remove('hidden');
        document.getElementById('recruiterResultsSection').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        alert(`Error: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="trophy" class="w-4 h-4"></i> Rank & Compare Candidates`;
        initLucide();
    }
}

function renderBatchLeaderboard(candidates) {
    const tbody = document.getElementById('batchLeaderboardBody');
    tbody.innerHTML = '';

    document.getElementById('batchLeaderboardTotal').textContent = `${candidates.length} Candidates Evaluated`;

    candidates.forEach((cand, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';

        const tierBadgeClass = cand.fit_tier === 'Exceptional Match' ? 'bg-emerald-100 text-emerald-800' :
                               cand.fit_tier === 'Strong Match' ? 'bg-blue-100 text-blue-800' :
                               cand.fit_tier === 'Moderate Match' ? 'bg-amber-100 text-amber-800' :
                               'bg-rose-100 text-rose-800';

        const matchedTop = (cand.skills_analysis?.matched_skills || []).slice(0, 3).join(', ');
        const missingCrit = (cand.skills_analysis?.critical_missing_skills || []).slice(0, 2).join(', ');

        tr.innerHTML = `
            <td class="py-3 px-4 text-center font-bold text-slate-800">#${idx + 1}</td>
            <td class="py-3 px-4 font-semibold text-slate-900">
                ${cand.candidate_name}
                <div class="text-2xs text-slate-400 font-normal truncate max-w-[140px]">${cand.filename}</div>
            </td>
            <td class="py-3 px-4 text-center">
                <span class="inline-block px-2.5 py-1 font-bold text-sm rounded-lg ${
                    cand.overall_score >= 70 ? 'text-emerald-700 bg-emerald-50' :
                    cand.overall_score >= 50 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                }">
                    ${cand.overall_score}%
                </span>
            </td>
            <td class="py-3 px-4 text-center text-xs text-slate-700 font-medium">${cand.scores?.skills_score}%</td>
            <td class="py-3 px-4 text-center text-xs text-slate-700 font-medium">${cand.scores?.ats_formatting_score}%</td>
            <td class="py-3 px-4 text-center">
                <span class="inline-block text-2xs px-2 py-0.5 rounded font-semibold ${tierBadgeClass}">
                    ${cand.fit_tier}
                </span>
            </td>
            <td class="py-3 px-4 text-xs text-slate-600">
                <div class="truncate max-w-[170px]" title="${matchedTop}">
                    <span class="text-emerald-600 font-medium">✓</span> ${matchedTop || 'None'}
                </div>
            </td>
            <td class="py-3 px-4 text-xs text-slate-600">
                <div class="truncate max-w-[170px] text-rose-600" title="${missingCrit}">
                    ${missingCrit ? '✗ ' + missingCrit : '<span class="text-emerald-600">None</span>'}
                </div>
            </td>
            <td class="py-3 px-4 text-center">
                <button class="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded text-blue-600 hover:bg-blue-50 transition-colors view-candidate-btn" data-index="${idx}">
                    Inspect
                </button>
            </td>
        `;

        tr.querySelector('.view-candidate-btn').addEventListener('click', () => {
            state.lastAnalysis = cand;
            switchMode('single');
            renderSingleResults(cand);
            document.getElementById('singleResultsSection').scrollIntoView({ behavior: 'smooth' });
        });

        tbody.appendChild(tr);
    });
}

function filterBatchLeaderboard(e) {
    const term = e.target.value.toLowerCase();
    if (!state.lastBatchResults) return;
    const filtered = state.lastBatchResults.filter(c => 
        c.candidate_name.toLowerCase().includes(term) ||
        c.filename.toLowerCase().includes(term) ||
        (c.skills_analysis.matched_skills || []).some(s => s.toLowerCase().includes(term))
    );
    renderBatchLeaderboard(filtered);
}
