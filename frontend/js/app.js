/**
 * TalentScan AI - Modern Application Controller
 * Handles Studio split-view workspace, Navigation Views, Theme switching,
 * REST API interactions, Chart.js radar charts, Recruiter Leaderboard, and AI tools.
 */

// Application State
const state = {
    currentView: 'studio',
    theme: 'dark',
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

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLucide();
    initNavigation();
    initEventListeners();
    fetchSamples();
});

function initLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Dark / Light Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('talentscan_theme') || 'dark';
    setTheme(savedTheme);

    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('talentscan_theme', theme);

    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    if (theme === 'dark') {
        html.classList.add('dark');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
        if (themeText) themeText.textContent = 'Light Theme';
    } else {
        html.classList.remove('dark');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
        if (themeText) themeText.textContent = 'Dark Theme';
    }

    if (state.chartInstance && state.lastAnalysis) {
        renderRadarChart(state.lastAnalysis.scores);
    }
    initLucide();
}

// Navigation between views
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view) switchView(view);
        });
    });

    document.getElementById('btnSidebarNewAnalysis')?.addEventListener('click', () => {
        switchView('studio');
        resetStudioInputs();
    });
}

function switchView(viewId) {
    state.currentView = viewId;

    // Update sidebar navigation buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        const matches = btn.getAttribute('data-view') === viewId;
        if (matches) {
            btn.className = 'nav-item active w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs';
        } else {
            btn.className = 'nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900';
        }
    });

    // Update Header Title
    const titles = {
        studio: { text: 'Resume Match Studio', icon: 'file-search' },
        recruiter: { text: 'Recruiter Leaderboard', icon: 'users' },
        enhancer: { text: 'Bullet Point Lab (XYZ)', icon: 'sparkles' },
        interview: { text: 'Interview Copilot', icon: 'message-square' },
        taxonomy: { text: '1,000+ Skill Taxonomy', icon: 'database' }
    };
    const t = titles[viewId] || titles.studio;
    const titleEl = document.getElementById('headerBreadcrumbTitle');
    if (titleEl) {
        titleEl.innerHTML = `<i data-lucide="${t.icon}" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"></i> ${t.text}`;
    }

    // Toggle active view container
    document.querySelectorAll('.app-view').forEach(viewEl => {
        viewEl.classList.add('hidden');
    });

    const targetEl = document.getElementById('view' + viewId.charAt(0).toUpperCase() + viewId.slice(1));
    if (targetEl) {
        targetEl.classList.remove('hidden');
    }

    initLucide();
}

// Fetch Sample Library
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

// One-Click Scenario Loader
async function loadSampleScenario(key) {
    if (!state.samples) {
        await fetchSamples();
    }
    if (!state.samples) return;

    switchView('studio');

    let jdKey = 'senior_fullstack_engineer';
    let resKey = 'alex_turner_fullstack';

    if (key === 'fullstack_alex') {
        jdKey = 'senior_fullstack_engineer';
        resKey = 'alex_turner_fullstack';
    } else if (key === 'datascience_sarah') {
        jdKey = 'lead_data_scientist';
        resKey = 'sarah_chen_datascience';
    } else if (key === 'devops_marcus') {
        jdKey = 'devops_cloud_architect';
        resKey = 'marcus_vance_devops';
    } else if (key === 'junior_gap_test') {
        jdKey = 'senior_fullstack_engineer';
        resKey = 'jordan_lee_junior_dev';
    }

    const jdText = state.samples.job_descriptions[jdKey]?.content;
    const resText = state.samples.resumes[resKey]?.content;

    if (jdText && resText) {
        setResumeInputType('paste');
        setJDInputType('paste');

        document.getElementById('resumeTextArea').value = resText;
        document.getElementById('jdTextArea').value = jdText;

        showToast('Sample Loaded', `Testing ${resKey.replace(/_/g, ' ')}...`, 'info');
        runSingleAnalysis();
    }
}

// Event Listeners
function initEventListeners() {
    // Resume Input Toggle (File vs Paste)
    document.getElementById('resumeToggleFile')?.addEventListener('click', () => setResumeInputType('file'));
    document.getElementById('resumeTogglePaste')?.addEventListener('click', () => setResumeInputType('paste'));

    // JD Input Toggle (Paste vs File)
    document.getElementById('jdTogglePaste')?.addEventListener('click', () => setJDInputType('paste'));
    document.getElementById('jdToggleFile')?.addEventListener('click', () => setJDInputType('file'));

    // Dropzones
    setupDropZone('resumeDropZone', 'resumeFileInput', handleResumeFileSelect);
    setupDropZone('jdDropZone', 'jdFileInput', handleJDFileSelect);
    setupDropZone('batchDropZone', 'batchFileInput', handleBatchFilesSelect);

    // Analyze Action Buttons
    document.getElementById('btnAnalyzeSingle')?.addEventListener('click', runSingleAnalysis);
    document.getElementById('btnAnalyzeBatch')?.addEventListener('click', runBatchAnalysis);

    // AI Tools
    document.getElementById('btnEnhanceBullet')?.addEventListener('click', handleEnhanceBullet);
    document.getElementById('btnGenInterview')?.addEventListener('click', handleGenInterviewPrep);

    // Top Actions
    document.getElementById('btnTopDownloadPDF')?.addEventListener('click', downloadCurrentReportPDF);
    document.getElementById('btnTopPrint')?.addEventListener('click', () => window.print());
    document.getElementById('btnTopReset')?.addEventListener('click', resetStudioInputs);

    // Copy Missing Skills
    document.getElementById('btnCopyMissingSkills')?.addEventListener('click', copyMissingSkillsToClipboard);

    // Batch Search
    document.getElementById('batchSearchInput')?.addEventListener('input', filterBatchLeaderboard);
}

function setResumeInputType(type) {
    const fileArea = document.getElementById('resumeFileArea');
    const pasteArea = document.getElementById('resumePasteArea');
    const btnFile = document.getElementById('resumeToggleFile');
    const btnPaste = document.getElementById('resumeTogglePaste');

    if (type === 'file') {
        fileArea.classList.remove('hidden');
        pasteArea.classList.add('hidden');
        btnFile.className = 'px-2.5 py-1 rounded-md font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs transition-all';
        btnPaste.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all';
    } else {
        fileArea.classList.add('hidden');
        pasteArea.classList.remove('hidden');
        btnPaste.className = 'px-2.5 py-1 rounded-md font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs transition-all';
        btnFile.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all';
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
        btnPaste.className = 'px-2.5 py-1 rounded-md font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 shadow-2xs transition-all';
        btnFile.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all';
    } else {
        pasteArea.classList.add('hidden');
        fileArea.classList.remove('hidden');
        btnFile.className = 'px-2.5 py-1 rounded-md font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 shadow-2xs transition-all';
        btnPaste.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all';
    }
}

function resetStudioInputs() {
    state.resumeFile = null;
    state.jdFile = null;
    state.lastAnalysis = null;

    document.getElementById('resumeTextArea').value = '';
    document.getElementById('jdTextArea').value = '';

    document.getElementById('resumeFileSelected')?.classList.add('hidden');
    document.getElementById('resumeDropContent')?.classList.remove('hidden');
    document.getElementById('jdFileSelected')?.classList.add('hidden');
    document.getElementById('jdDropContent')?.classList.remove('hidden');

    document.getElementById('studioEmptyState')?.classList.remove('hidden');
    document.getElementById('studioResultsCanvas')?.classList.add('hidden');

    document.getElementById('btnTopDownloadPDF')?.classList.add('hidden');
    document.getElementById('btnTopPrint')?.classList.add('hidden');

    showToast('Reset Complete', 'Studio inputs cleared.', 'info');
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
    showToast('File Attached', file.name, 'success');
}

function handleJDFileSelect(files) {
    const file = files[0];
    if (!file) return;
    state.jdFile = file;
    document.getElementById('jdFileName').textContent = file.name;
    document.getElementById('jdFileSelected').classList.remove('hidden');
    document.getElementById('jdDropContent').classList.add('hidden');
    showToast('JD Attached', file.name, 'success');
}

function handleBatchFilesSelect(files) {
    state.batchFiles = Array.from(files);
    const container = document.getElementById('batchFilesList');
    container.innerHTML = '';

    const badge = document.getElementById('batchCountBadge');
    badge.textContent = `${state.batchFiles.length} Resumes Ready`;
    badge.classList.remove('hidden');

    state.batchFiles.slice(0, 8).forEach(file => {
        const item = document.createElement('div');
        item.className = 'text-3xs px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 font-semibold';
        item.innerHTML = `<i data-lucide="file-text" class="w-3 h-3"></i> <span class="truncate max-w-[130px]">${file.name}</span>`;
        container.appendChild(item);
    });
    if (state.batchFiles.length > 8) {
        const more = document.createElement('span');
        more.className = 'text-3xs text-slate-400 self-center font-bold';
        more.textContent = `+${state.batchFiles.length - 8} more`;
        container.appendChild(more);
    }
    initLucide();
    showToast('Resumes Ready', `${state.batchFiles.length} files prepared for batch comparison`, 'info');
}

// Single Analysis
async function runSingleAnalysis() {
    const btn = document.getElementById('btnAnalyzeSingle');
    const spinner = document.getElementById('analyzeSpinner');
    const btnText = document.getElementById('analyzeBtnText');

    const formData = new FormData();

    // Resume
    const isFileTab = !document.getElementById('resumeFileArea').classList.contains('hidden');
    if (isFileTab && state.resumeFile) {
        formData.append('resume_file', state.resumeFile);
    } else {
        const text = document.getElementById('resumeTextArea').value.trim();
        if (!text) {
            showToast('Input Required', 'Please select a resume file or paste text.', 'error');
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
            showToast('Input Required', 'Please provide a target job description.', 'error');
            return;
        }
        formData.append('jd_text', jdText);
    }

    btn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'Scanning candidate profile...';

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
        showToast('Analysis Complete', `${data.candidate_name}: ${data.overall_score}% Match (${data.fit_tier})`, 'success');
    } catch (err) {
        showToast('Analysis Error', err.message, 'error');
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Run AI Match & Scoring';
    }
}

// Render Results on Studio Canvas
function renderSingleResults(data) {
    document.getElementById('studioEmptyState')?.classList.add('hidden');
    document.getElementById('studioResultsCanvas')?.classList.remove('hidden');

    document.getElementById('btnTopDownloadPDF')?.classList.remove('hidden');
    document.getElementById('btnTopPrint')?.classList.remove('hidden');

    document.getElementById('resCandidateName').textContent = data.candidate_name || 'Candidate';
    document.getElementById('resFileName').textContent = data.filename || 'Resume';
    document.getElementById('resVerdict').textContent = data.verdict;
    document.getElementById('resFitTier').textContent = data.fit_tier;

    // Fit tier badge colors
    const tierBadge = document.getElementById('resFitTierBadge');
    if (data.overall_score >= 80) {
        tierBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    } else if (data.overall_score >= 65) {
        tierBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    } else if (data.overall_score >= 50) {
        tierBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    } else {
        tierBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
    }

    animateGauge(data.overall_score);

    // Score Breakdown
    const sc = data.scores || {};
    document.getElementById('scoreSkills').textContent = `${sc.skills_score}%`;
    document.getElementById('scoreSemantic').textContent = `${sc.semantic_score}%`;
    document.getElementById('scoreExp').textContent = `${sc.experience_score}%`;
    document.getElementById('scoreATS').textContent = `${sc.ats_formatting_score}%`;

    // Candidate Credentials
    const ats = data.ats_metrics || {};
    const contact = ats.contact || {};
    document.getElementById('metaEmail').textContent = contact.email || 'Not detected';
    document.getElementById('metaPhone').textContent = contact.phone || 'Not detected';

    const linksEl = document.getElementById('metaLinks');
    linksEl.innerHTML = '';
    if (contact.linkedin) {
        linksEl.innerHTML += `<a href="${contact.linkedin}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mr-2"><i data-lucide="linkedin" class="w-3 h-3"></i> LinkedIn</a>`;
    }
    if (contact.github) {
        linksEl.innerHTML += `<a href="${contact.github}" target="_blank" class="text-slate-800 dark:text-slate-200 hover:underline inline-flex items-center gap-1"><i data-lucide="github" class="w-3 h-3"></i> GitHub</a>`;
    }
    if (!contact.linkedin && !contact.github) {
        linksEl.textContent = 'None';
    }

    const exp = data.experience_analysis || {};
    document.getElementById('metaExpYears').textContent = `${exp.candidate_years} yrs (Job: ~${exp.required_years} yrs)`;
    document.getElementById('metaSeniority').textContent = `${exp.candidate_seniority}`;

    document.getElementById('metaWordCount').textContent = ats.word_count || 0;
    document.getElementById('metaActionVerbs').textContent = ats.action_verbs_count || 0;
    document.getElementById('metaMetricsCount').textContent = ats.metrics_count || 0;

    renderRadarChart(sc);
    renderSkillsAudit(data.skills_analysis);
    renderSuggestions(data.suggestions);

    initLucide();
}

function animateGauge(score) {
    const circle = document.getElementById('scoreCircle');
    const scoreText = document.getElementById('overallScoreText');
    if (!circle || !scoreText) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    if (score >= 80) circle.style.stroke = '#10b981';
    else if (score >= 65) circle.style.stroke = '#6366f1';
    else if (score >= 50) circle.style.stroke = '#f59e0b';
    else circle.style.stroke = '#ef4444';

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

    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)';
    const textColor = isDark ? '#94a3b8' : '#475569';

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
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                pointBackgroundColor: '#4f46e5',
                pointBorderColor: '#ffffff',
                borderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: {
                        font: { size: 10, family: "'Plus Jakarta Sans', sans-serif", weight: '700' },
                        color: textColor
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

    document.getElementById('critMissingCount').textContent = skills.critical_missing_skills?.length || 0;
    document.getElementById('allMissingCount').textContent = skills.missing_count || 0;
    document.getElementById('matchedCount').textContent = skills.matched_count || 0;

    // Critical Missing
    critContainer.innerHTML = '';
    const critList = skills.critical_missing_skills || [];
    if (critList.length === 0) {
        critContainer.innerHTML = '<span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> None! All high-priority skills covered.</span>';
    } else {
        critList.forEach(skill => {
            const pill = document.createElement('span');
            pill.className = 'inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-lg text-2xs font-bold shadow-2xs hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer';
            pill.innerHTML = `<i data-lucide="alert-triangle" class="w-3 h-3 text-rose-500"></i> ${skill}`;
            pill.title = 'Click to copy';
            pill.onclick = () => {
                navigator.clipboard.writeText(skill);
                showToast('Copied', `"${skill}" copied to clipboard`, 'info');
            };
            critContainer.appendChild(pill);
        });
    }

    // Matched Skills
    matchedContainer.innerHTML = '';
    const matched = skills.matched_skills || [];
    matched.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-lg text-2xs font-bold shadow-2xs';
        pill.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-500"></i> ${skill}`;
        matchedContainer.appendChild(pill);
    });

    // All Missing
    allMissingContainer.innerHTML = '';
    const allMiss = skills.missing_skills || [];
    allMiss.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'inline-flex items-center px-2 py-0.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded text-3xs font-medium';
        pill.textContent = skill;
        allMissingContainer.appendChild(pill);
    });

    // Extra skills
    extraContainer.innerHTML = '';
    const extra = skills.extra_skills || [];
    extra.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'inline-flex items-center px-2 py-0.5 bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded text-3xs font-bold';
        pill.textContent = skill;
        extraContainer.appendChild(pill);
    });
}

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsContainer');
    container.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = '<div class="text-xs text-emerald-600 dark:text-emerald-400 font-bold p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">No major optimization gaps detected. Excellent alignment!</div>';
        return;
    }

    suggestions.forEach(item => {
        const borderCol = item.type === 'critical' ? 'border-l-4 border-l-rose-500 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20' :
                          item.type === 'warning' ? 'border-l-4 border-l-amber-500 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20' : 
                          'border-l-4 border-l-blue-500 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20';
        const iconBg = item.type === 'critical' ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400' :
                       item.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400';

        const div = document.createElement('div');
        div.className = `p-3.5 rounded-xl border ${borderCol} flex gap-3 shadow-2xs card-hover-lift`;
        div.innerHTML = `
            <div class="w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5">
                <i data-lucide="${item.icon || 'info'}" class="w-3.5 h-3.5"></i>
            </div>
            <div>
                <h5 class="text-2xs font-extrabold text-slate-900 dark:text-white">${item.title}</h5>
                <p class="text-3xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">${item.message}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

function copyMissingSkillsToClipboard() {
    if (!state.lastAnalysis) return;
    const missing = state.lastAnalysis.skills_analysis.missing_skills || [];
    if (missing.length === 0) {
        showToast('Info', 'No missing skills to copy!', 'info');
        return;
    }
    navigator.clipboard.writeText(missing.join(', ')).then(() => {
        showToast('Copied to Clipboard', `${missing.length} missing skills copied.`, 'success');
    });
}

// AI Bullet Enhancer
async function handleEnhanceBullet() {
    const input = document.getElementById('inputBulletText').value.trim();
    const skill = document.getElementById('inputBulletSkill').value.trim();
    const resultsContainer = document.getElementById('bulletVariationsContainer');

    if (!input) {
        showToast('Required', 'Please enter a bullet point to enhance.', 'error');
        return;
    }

    const btn = document.getElementById('btnEnhanceBullet');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Generating XYZ variations...`;
    initLucide();

    try {
        const res = await fetch('/api/ai/enhance-bullet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bullet: input, target_skill: skill })
        });
        const data = await res.json();

        resultsContainer.innerHTML = '';
        const optThemes = [
            { border: 'border-blue-200 dark:border-blue-900', bg: 'bg-blue-50/50 dark:bg-blue-950/20', badge: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', title: 'Option 1 • Impact & Metrics' },
            { border: 'border-indigo-200 dark:border-indigo-900', bg: 'bg-indigo-50/50 dark:bg-indigo-950/20', badge: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', title: 'Option 2 • Architecture & Scale' },
            { border: 'border-purple-200 dark:border-purple-900', bg: 'bg-purple-50/50 dark:bg-purple-950/20', badge: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', title: 'Option 3 • Speed & Uptime' }
        ];

        data.variations.forEach((varText, idx) => {
            const theme = optThemes[idx % optThemes.length];
            const card = document.createElement('div');
            card.className = `p-3.5 ${theme.bg} border-2 ${theme.border} rounded-xl shadow-xs transition-all`;
            card.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xs font-extrabold px-2.5 py-0.5 rounded-full border ${theme.badge}">${theme.title}</span>
                    <button class="text-2xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold copy-btn bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                        <i data-lucide="copy" class="w-3 h-3"></i> Copy
                    </button>
                </div>
                <p class="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">${varText}</p>
            `;
            card.querySelector('.copy-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(varText);
                showToast('Copied', 'Enhanced bullet point copied to clipboard!', 'success');
            });
            resultsContainer.appendChild(card);
        });
        resultsContainer.classList.remove('hidden');
        initLucide();
    } catch (e) {
        showToast('Error', 'Failed to generate bullet variations.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i> Generate 3 High-Impact XYZ Variations`;
        initLucide();
    }
}

// AI Interview Prep
async function handleGenInterviewPrep() {
    let matched = [];
    let missing = [];
    let candName = 'Candidate';

    if (state.lastAnalysis) {
        matched = state.lastAnalysis.skills_analysis.matched_skills;
        missing = state.lastAnalysis.skills_analysis.missing_skills;
        candName = state.lastAnalysis.candidate_name;
    } else {
        matched = ['Python', 'FastAPI', 'Docker', 'React'];
        missing = ['Kubernetes', 'Terraform'];
    }

    const btn = document.getElementById('btnGenInterview');
    const container = document.getElementById('interviewQuestionsList');

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Generating questions...`;
    initLucide();

    try {
        const res = await fetch('/api/ai/interview-prep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matched_skills: matched,
                missing_skills: missing,
                candidate_name: candName
            })
        });
        const data = await res.json();

        container.innerHTML = '';
        data.questions.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5';
            item.innerHTML = `
                <div class="text-3xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">${q.category}</div>
                <div class="text-xs font-bold text-slate-900 dark:text-white">Q${idx + 1}: ${q.question}</div>
                <div class="text-2xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-1.5">
                    <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5"></i>
                    <span><strong>Interviewer & Prep Tip:</strong> ${q.tip}</span>
                </div>
            `;
            container.appendChild(item);
        });
        container.classList.remove('hidden');
        initLucide();
    } catch (e) {
        showToast('Error', 'Failed to generate interview questions.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="message-square" class="w-4 h-4 text-pink-300"></i> Generate Tailored Interview Questions`;
        initLucide();
    }
}

// Download PDF Report
async function downloadCurrentReportPDF() {
    if (!state.lastAnalysis) {
        showToast('No Data', 'Run an analysis first to download the report.', 'error');
        return;
    }
    showToast('Generating PDF', 'Compiling executive audit report...', 'info');

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
        showToast('Downloaded', `Report saved for ${state.lastAnalysis.candidate_name}`, 'success');
    } catch (e) {
        showToast('Error', 'Failed to generate PDF.', 'error');
    }
}

// Batch Recruiter Analysis
async function runBatchAnalysis() {
    if (!state.batchFiles || state.batchFiles.length === 0) {
        showToast('Required', 'Please select multiple resumes to rank.', 'error');
        return;
    }

    const jdText = document.getElementById('batchJDTextArea').value.trim();
    if (!jdText) {
        showToast('Required', 'Please provide a target job description.', 'error');
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
        showToast('Leaderboard Ready', `${data.candidates.length} candidates evaluated and ranked.`, 'success');
    } catch (e) {
        showToast('Error', e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="trophy" class="w-4 h-4 text-amber-300"></i> Rank & Compare Candidates`;
        initLucide();
    }
}

function renderBatchLeaderboard(candidates) {
    const tbody = document.getElementById('batchLeaderboardBody');
    tbody.innerHTML = '';

    document.getElementById('batchLeaderboardTotal').textContent = `${candidates.length} Evaluated`;

    candidates.forEach((cand, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors';

        const tierBadgeClass = cand.fit_tier === 'Exceptional Match' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                               cand.fit_tier === 'Strong Match' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                               cand.fit_tier === 'Moderate Match' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                               'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800';

        const matchedTop = (cand.skills_analysis?.matched_skills || []).slice(0, 3).join(', ');
        const missingCrit = (cand.skills_analysis?.critical_missing_skills || []).slice(0, 2).join(', ');

        let rankBadge = `#${idx + 1}`;
        if (idx === 0) {
            rankBadge = `<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-black text-2xs">🥇 #1</span>`;
        } else if (idx === 1) {
            rankBadge = `<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-black text-2xs">🥈 #2</span>`;
        } else if (idx === 2) {
            rankBadge = `<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-700 font-black text-2xs">🥉 #3</span>`;
        } else {
            rankBadge = `<span class="font-bold text-slate-500">#${idx + 1}</span>`;
        }

        tr.innerHTML = `
            <td class="py-3 px-4 text-center">${rankBadge}</td>
            <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">
                ${cand.candidate_name}
                <div class="text-3xs text-slate-400 font-normal truncate max-w-[130px]">${cand.filename}</div>
            </td>
            <td class="py-3 px-4 text-center">
                <span class="inline-block px-2.5 py-1 font-black text-xs rounded-lg ${
                    cand.overall_score >= 70 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800' :
                    cand.overall_score >= 50 ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800' : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800'
                }">
                    ${cand.overall_score}%
                </span>
            </td>
            <td class="py-3 px-4 text-center text-xs font-bold text-blue-600 dark:text-blue-400">${cand.scores?.skills_score}%</td>
            <td class="py-3 px-4 text-center text-xs font-bold text-amber-600 dark:text-amber-400">${cand.scores?.ats_formatting_score}%</td>
            <td class="py-3 px-4 text-center">
                <span class="inline-block text-3xs px-2 py-0.5 rounded-full font-bold ${tierBadgeClass}">
                    ${cand.fit_tier}
                </span>
            </td>
            <td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                <div class="truncate max-w-[160px]" title="${matchedTop}">
                    <span class="text-emerald-600 font-bold">✓</span> ${matchedTop || 'None'}
                </div>
            </td>
            <td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                <div class="truncate max-w-[160px] text-rose-600 dark:text-rose-400" title="${missingCrit}">
                    ${missingCrit ? '✗ ' + missingCrit : '<span class="text-emerald-600 font-bold">None</span>'}
                </div>
            </td>
            <td class="py-3 px-4 text-center">
                <button class="px-2.5 py-1 text-2xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all view-candidate-btn" data-index="${idx}">
                    Inspect
                </button>
            </td>
        `;

        tr.querySelector('.view-candidate-btn').addEventListener('click', () => {
            state.lastAnalysis = cand;
            switchView('studio');
            renderSingleResults(cand);
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

// Toast Notifications Helper
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const borderCol = type === 'success' ? 'border-emerald-500' :
                      type === 'error' ? 'border-rose-500' : 'border-indigo-500';
    const iconName = type === 'success' ? 'check-circle' :
                     type === 'error' ? 'alert-triangle' : 'info';
    const iconColor = type === 'success' ? 'text-emerald-500' :
                      type === 'error' ? 'text-rose-500' : 'text-indigo-500';

    toast.className = `p-3.5 bg-white dark:bg-slate-900 border-l-4 ${borderCol} border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex items-center gap-3 min-w-[280px] max-w-sm pointer-events-auto toast-enter`;
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="w-5 h-5 ${iconColor} shrink-0"></i>
        <div class="flex-1">
            <h6 class="text-xs font-bold text-slate-900 dark:text-white">${title}</h6>
            <p class="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">${message}</p>
        </div>
    `;

    container.appendChild(toast);
    initLucide();

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}
