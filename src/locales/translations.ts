// src/locales/translations.ts
// BaiteConnect — Complete tri-lingual translation dictionary
// Languages: English (en) | Kiswahili (sw) | Kimîîru (ki)

export const translations = {
  // ── Navigation ────────────────────────────────────────────
  nav: {
    home:         { en: 'Home',               sw: 'Nyumbani',              ki: 'Inyumba' },
    submit:       { en: 'Submit Memo',         sw: 'Tuma Maombi',           ki: 'Tuma Ûrîa' },
    budget:       { en: 'Budget Tool',         sw: 'Zana ya Bajeti',        ki: 'Ûgawîrîri' },
    projects:     { en: 'Projects',            sw: 'Miradi',                ki: 'Imirimo' },
    leaderboard:  { en: 'Ward League',         sw: 'Orodha ya Wodi',        ki: 'Wodi League' },
    admin:        { en: 'Executive',           sw: 'Mtendaji',              ki: 'Ûtongeria' },
    language:     { en: 'Language',            sw: 'Lugha',                 ki: 'Rûgano' },
  },

  // ── App Identity ──────────────────────────────────────────
  app: {
    name:         { en: 'BaiteConnect',        sw: 'BaiteConnect',          ki: 'BaiteConnect' },
    tagline:      { en: 'Your Voice. Your County. Your Budget.',
                    sw: 'Sauti Yako. Kaunti Yako. Bajeti Yako.',
                    ki: 'Rûgano rwako. Ûtonga wako. Bajeti yako.' },
    county:       { en: 'Meru County',         sw: 'Kaunti ya Meru',        ki: 'Meru County' },
    domain:       { en: 'baiteconnect.meru.go.ke', sw: 'baiteconnect.meru.go.ke', ki: 'baiteconnect.meru.go.ke' },
    fiscalYear:   { en: 'FY 2026/2027',        sw: 'Mwaka wa Fedha 2026/2027', ki: 'FY 2026/2027' },
    participation:{ en: 'Public Participation', sw: 'Ushiriki wa Umma',      ki: 'Kwaragîria kwa Mûwingî' },
  },

  // ── Sectors ───────────────────────────────────────────────
  sectors: {
    health:       { en: 'Health',              sw: 'Afya',                  ki: 'Ugîma bwa Mwîrî' },
    agriculture:  { en: 'Agriculture',         sw: 'Kilimo',                ki: 'Ushororeri / Ûrîmî' },
    roads:        { en: 'Roads & Infrastructure', sw: 'Barabara na Usafirishaji', ki: 'Njîra na Mathithio' },
    water:        { en: 'Water & Environment', sw: 'Maji na Mazingira',     ki: 'Rûjî na Mathithio' },
    publicService:{ en: 'General Public Service', sw: 'Huduma za Umma',    ki: 'Ûtongeria wa Mûwingi' },
  },

  // ── Home Page ─────────────────────────────────────────────
  home: {
    heroTitle:    { en: 'Shape Meru\'s Budget.',     sw: 'Unda Bajeti ya Meru.',       ki: 'Ranga Bajeti ya Meru.' },
    heroSubtitle: { en: 'Submit your ward\'s priorities directly to the Governor\'s planning desk.',
                    sw: 'Tuma vipaumbele vya wodi yako moja kwa moja kwenye dawati la mipango la Gavana.',
                    ki: 'Tuma ûrûgano wa wodi yako moja kwa moja kwa Gavana.' },
    ctaSubmit:    { en: 'Submit a Memo',             sw: 'Tuma Maombi',               ki: 'Tuma Ûrîa' },
    ctaBudget:    { en: 'Explore Budget',             sw: 'Angalia Bajeti',             ki: 'Angalia Bajeti' },
    statSubmissions: { en: 'Total Submissions',      sw: 'Maombi Yote',               ki: 'Maombi Yote' },
    statResidents:   { en: 'Verified Residents',     sw: 'Wakazi Waliothibitishwa',    ki: 'Wakazi Waliothibitishwa' },
    statWards:       { en: 'Active Wards',            sw: 'Wodi Zinazofanya Kazi',     ki: 'Wodi Zinazofanya Kazi' },
    statProjects:    { en: 'Projects Tracked',        sw: 'Miradi Inayofuatiliwa',     ki: 'Imirimo Inayofuatiliwa' },
    voteTitle:    { en: 'Ward Priorities — Vote Now', sw: 'Vipaumbele vya Wodi — Piga Kura', ki: 'Ûrûgano wa Wodi — Piga Kura' },
    voteSubtitle: { en: 'Verified residents only. One upvote per submission per week.',
                    sw: 'Wakazi walioidhibitishwa pekee. Kura moja kwa wiki.',
                    ki: 'Wakazi waliothibitishwa pekee. Kura moja kwa wiki.' },
  },

  // ── Form ──────────────────────────────────────────────────
  form: {
    title:        { en: 'Submit Your Budget Memorandum', sw: 'Tuma Maombi ya Bajeti', ki: 'Tuma Maombi ya Bajeti' },
    step1:        { en: 'Identity & Ward',            sw: 'Utambulisho na Wodi',    ki: 'Utambulisho na Wodi' },
    step2:        { en: 'Phone Verification',          sw: 'Uthibitisho wa Simu',   ki: 'Uthibitisho wa Simu' },
    step3:        { en: 'Your Priorities',             sw: 'Vipaumbele Vyako',      ki: 'Ûrûgano wako' },
    fullName:     { en: 'Full Name',                   sw: 'Jina Kamili',           ki: 'Rîîtwa Rîria' },
    nationalId:   { en: 'National ID Number',          sw: 'Nambari ya Kitambulisho', ki: 'Nambari ya Kitambulisho' },
    phone:        { en: 'Phone Number',                sw: 'Nambari ya Simu',       ki: 'Nambari ya Simu' },
    subCounty:    { en: 'Sub-County',                  sw: 'Kaunti Ndogo',          ki: 'Kaunti Ndogo' },
    ward:         { en: 'Ward',                        sw: 'Wodi',                  ki: 'Wodi' },
    sector:       { en: 'Sector Priority',             sw: 'Sekta ya Kipaumbele',   ki: 'Sekta ya Kipaumbele' },
    memo:         { en: 'Your Memorandum',             sw: 'Maombi Yako',           ki: 'Maombi Yako' },
    memoPlaceholder: {
      en: 'Describe your specific development priority for your ward. Name the exact location, the problem it solves, and how many households it will serve...',
      sw: 'Elezea kipaumbele chako cha maendeleo kwa wodi yako. Taja mahali halisi, tatizo inayotatua, na kaya ngapi itakazohudumia...',
      ki: 'Elezea ûrûgano wako wa maendeleo kwa wodi yako...',
    },
    upload:       { en: 'Attach Document (optional)', sw: 'Ambatanisha Hati (hiari)', ki: 'Ambatanisha Hati (hiari)' },
    uploadHint:   { en: 'PDF, JPG or PNG • Max 5MB',  sw: 'PDF, JPG au PNG • Upeo 5MB', ki: 'PDF, JPG au PNG • Upeo 5MB' },
    continue:     { en: 'Continue',                   sw: 'Endelea',               ki: 'Endelea' },
    back:         { en: 'Back',                        sw: 'Rudi',                  ki: 'Rudi' },
    submit:       { en: 'Submit Memorandum',           sw: 'Tuma Maombi',           ki: 'Tuma Maombi' },
    sendOtp:      { en: 'Send Verification Code',      sw: 'Tuma Nambari ya Uthibitisho', ki: 'Tuma Nambari ya Uthibitisho' },
    verifyOtp:    { en: 'Verify Code',                 sw: 'Thibitisha Nambari',    ki: 'Thibitisha Nambari' },
    otpSent:      { en: 'A 6-digit code was sent to',  sw: 'Nambari ya tarakimu 6 ilitumwa kwa', ki: 'Nambari ya tarakimu 6 ilitumwa kwa' },
    verified:     { en: 'Identity confirmed',          sw: 'Utambulisho umethibitishwa', ki: 'Utambulisho umethibitishwa' },
    success:      { en: 'Memorandum Received!',        sw: 'Maombi Yamepokelewa!',  ki: 'Maombi Yamepokelewa!' },
    successMsg:   { en: 'Your submission has been recorded. You will receive an SMS update when your memo is reviewed by the County Finance team.',
                    sw: 'Maombi yako yamerekodiwa. Utapokea ujumbe wa SMS wakati timu ya Fedha ya Kaunti itakapoangalia maombi yako.',
                    ki: 'Maombi yako yamerekodiwa. Utapokea SMS.' },
    reference:    { en: 'Reference Number',            sw: 'Nambari ya Marejeleo',  ki: 'Nambari ya Marejeleo' },
    selectSubCounty: { en: 'Select sub-county…',       sw: 'Chagua kaunti ndogo…',  ki: 'Chagua kaunti ndogo…' },
    selectWard:   { en: 'Select ward…',                sw: 'Chagua wodi…',          ki: 'Chagua wodi…' },
  },

  // ── Budget Tool ───────────────────────────────────────────
  budget: {
    title:        { en: 'The 100-Shilling Budget Balancer', sw: 'Msawazishaji wa Bajeti ya Shilingi 100', ki: 'Sarafu ya Shilingi 100' },
    subtitle:     { en: 'Out of every KSh 100 Meru County spends, how much should go to each sector? Drag the sliders — they must balance to exactly 100 before you can submit.',
                    sw: 'Kwa kila Ksh 100 inayotumika na Kaunti ya Meru, kiasi gani kiende kwa kila sekta? Buruta vitufe — lazima visawazike hadi 100 kabisa kabla ya kutuma.',
                    ki: 'Kwa kila Ksh 100 inayotumika, kiasi gani kiende kwa kila sekta? Buruta vitufe.' },
    total:        { en: 'Total',                       sw: 'Jumla',                 ki: 'Jumla' },
    balanced:     { en: 'Balanced ✓',                 sw: 'Imesawazika ✓',         ki: 'Imesawazika ✓' },
    unbalanced:   { en: 'Must equal 100',              sw: 'Lazima iwe 100',        ki: 'Lazima iwe 100' },
    reset:        { en: 'Reset to defaults',           sw: 'Rudisha kwa msingi',    ki: 'Rudisha kwa msingi' },
    base:         { en: 'County baseline',             sw: 'Msingi wa Kaunti',      ki: 'Msingi wa Kaunti' },
  },

  // ── Projects ──────────────────────────────────────────────
  projects: {
    title:        { en: 'Project Delivery Tracker',   sw: 'Ufuatiliaji wa Utekelezaji wa Miradi', ki: 'Ufuatiliaji wa Imirimo' },
    reportIssue:  { en: 'Report Delivery Issue',       sw: 'Ripoti Tatizo la Utekelezaji', ki: 'Ripoti Tatizo' },
    reportHint:   { en: 'A geo-tagged, time-stamped photo from the project site is required.',
                    sw: 'Picha yenye eneo na muda kutoka eneo la mradi inahitajika.',
                    ki: 'Picha yenye eneo na muda inahitajika.' },
    mcaMatch:     { en: 'MCA Consensus',               sw: 'Makubaliano ya MCA',    ki: 'Makubaliano ya MCA' },
    underAudit:   { en: 'Under Administrative Audit',  sw: 'Chini ya Ukaguzi wa Utawala', ki: 'Chini ya Ukaguzi' },
    stages: {
      ALLOCATED:  { en: 'Allocated',                  sw: 'Imetengwa',             ki: 'Imetengwa' },
      TENDERED:   { en: 'Tender Awarded',              sw: 'Zabuni Imetolewa',      ki: 'Zabuni Imetolewa' },
      ONGOING:    { en: 'Ongoing',                     sw: 'Inaendelea',            ki: 'Inaendelea' },
      COMPLETED:  { en: 'Completed',                   sw: 'Imekamilika',           ki: 'Imekamilika' },
    },
  },

  // ── Leaderboard ───────────────────────────────────────────
  leaderboard: {
    title:        { en: 'Ward Civic Engagement League', sw: 'Ligi ya Ushiriki wa Kiraia wa Wodi', ki: 'League ya Ushiriki wa Wodi' },
    subtitle:     { en: 'Rankings by verified submissions across all 45 wards of Meru County.',
                    sw: 'Uorodheshaji kwa maombi yaliyoidhibitishwa katika wodi zote 45 za Kaunti ya Meru.',
                    ki: 'Uorodheshaji kwa wodi zote 45 za Meru County.' },
    rank:         { en: 'Rank',                        sw: 'Nafasi',                ki: 'Nafasi' },
    ward:         { en: 'Ward',                        sw: 'Wodi',                  ki: 'Wodi' },
    subCounty:    { en: 'Sub-County',                  sw: 'Kaunti Ndogo',          ki: 'Kaunti Ndogo' },
    submissions:  { en: 'Submissions',                 sw: 'Maombi',                ki: 'Maombi' },
  },

  // ── Executive / Admin ─────────────────────────────────────
  executive: {
    title:        { en: 'Governor\'s Executive Briefing', sw: 'Taarifa ya Mtendaji wa Gavana', ki: 'Taarifa ya Gavana' },
    matrixTitle:  { en: 'Citizen vs MCA Priority Alignment', sw: 'Uratibu wa Vipaumbele vya Wananchi dhidi ya MCA', ki: 'Uratibu wa Vipaumbele' },
    aligned:      { en: 'Aligned ✓',                   sw: 'Imeoanishwa ✓',         ki: 'Imeoanishwa ✓' },
    diverges:     { en: 'Diverges',                    sw: 'Inatofautiana',          ki: 'Inatofautiana' },
    exportPDF:    { en: 'Export MTEF PDF Report',       sw: 'Hamisha Ripoti ya MTEF PDF', ki: 'Hamisha Ripoti ya MTEF' },
    exportCFSP:   { en: 'Download CFSP Appendix',       sw: 'Pakua Kiambatisho cha CFSP', ki: 'Pakua CFSP' },
    smsDigest:    { en: 'Send Weekly SMS Digest',       sw: 'Tuma Muhtasari wa SMS wa Kila Wiki', ki: 'Tuma SMS Digest' },
  },

  // ── Common ────────────────────────────────────────────────
  common: {
    loading:      { en: 'Loading…',                    sw: 'Inapakia…',             ki: 'Inapakia…' },
    error:        { en: 'Something went wrong',         sw: 'Kuna tatizo',           ki: 'Kuna tatizo' },
    retry:        { en: 'Try again',                   sw: 'Jaribu tena',           ki: 'Jaribu tena' },
    close:        { en: 'Close',                       sw: 'Funga',                 ki: 'Funga' },
    save:         { en: 'Save',                        sw: 'Hifadhi',               ki: 'Hifadhi' },
    cancel:       { en: 'Cancel',                      sw: 'Ghairi',                ki: 'Ghairi' },
    ward:         { en: 'Ward',                        sw: 'Wodi',                  ki: 'Wodi' },
    of:           { en: 'of',                          sw: 'ya',                    ki: 'ya' },
    ksh:          { en: 'KSh',                         sw: 'KSh',                   ki: 'KSh' },
    yes:          { en: 'Yes',                         sw: 'Ndiyo',                 ki: 'Ndiyo' },
    no:           { en: 'No',                          sw: 'Hapana',                ki: 'Hapana' },
    governorNote: { en: 'Governor Isaac Mutuma M\'Ethingia — Meru County',
                    sw: 'Gavana Isaac Mutuma M\'Ethingia — Kaunti ya Meru',
                    ki: 'Gavana Isaac Mutuma M\'Ethingia — Meru County' },
    pfmNote:      { en: 'Aligned with PFM Act 2012 & Constitution of Kenya Article 201',
                    sw: 'Inaoana na Sheria ya PFM 2012 & Katiba ya Kenya Kifungu 201',
                    ki: 'Inaoana na PFM Act 2012' },
  },

  // ── Validation Errors ─────────────────────────────────────
  validation: {
    required:     { en: 'This field is required',      sw: 'Sehemu hii inahitajika', ki: 'Sehemu hii inahitajika' },
    invalidPhone: { en: 'Enter a valid Kenyan number (+254...)', sw: 'Ingiza nambari sahihi ya Kenya (+254...)', ki: 'Ingiza nambari sahihi (+254...)' },
    invalidId:    { en: 'National ID must be 7–8 digits', sw: 'Kitambulisho lazima kiwe tarakimu 7-8', ki: 'Kitambulisho: tarakimu 7-8' },
    memoTooShort: { en: 'Memo must be at least 30 characters', sw: 'Maombi lazima yawe na herufi 30 au zaidi', ki: 'Maombi: herufi 30 au zaidi' },
    balanceError: { en: 'Budget sliders must total exactly 100', sw: 'Jumla ya vitufe lazima iwe 100 hasa', ki: 'Jumla lazima iwe 100' },
    outsideWard:  { en: 'Your location appears outside the selected ward boundary. Submission flagged for review.',
                    sw: 'Eneo lako linaonekana nje ya mipaka ya wodi iliyochaguliwa.',
                    ki: 'Eneo lako liko nje ya wodi.' },
    rateLimited:  { en: 'Too many requests. Please wait before trying again.',
                    sw: 'Maombi mengi mno. Tafadhali subiri kabla ya kujaribu tena.',
                    ki: 'Maombi mengi mno. Subiri.' },
    duplicateMemo:{ en: 'You have already submitted a memorandum for this fiscal year.',
                    sw: 'Tayari umetuma maombi kwa mwaka huu wa fedha.',
                    ki: 'Tayari umetuma maombi mwaka huu.' },
  },
} as const

export type TranslationKey = typeof translations
export type SectionKey = keyof TranslationKey
