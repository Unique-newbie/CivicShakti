export type Language = "en" | "hi";

const translations: Record<string, Record<Language, string>> = {
    // ── Navbar ───────────────────────────────────────
    "nav.home": { en: "Home", hi: "होम" },
    "nav.explore": { en: "Explore Map", hi: "मानचित्र देखें" },
    "nav.report": { en: "Report Issue", hi: "शिकायत दर्ज करें" },
    "nav.track": { en: "Track Status", hi: "स्थिति ट्रैक करें" },
    "nav.howItWorks": { en: "How It Works", hi: "कैसे काम करता है" },
    "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
    "nav.profile": { en: "Profile", hi: "प्रोफ़ाइल" },
    "nav.signOut": { en: "Sign Out", hi: "लॉग आउट" },
    "nav.citizenLogin": { en: "Citizen Login", hi: "नागरिक लॉगिन" },
    "nav.authorityPortal": { en: "Authority Portal", hi: "अधिकारी पोर्टल" },

    // ── Landing Page ─────────────────────────────────
    "landing.heroTitle1": { en: "Report civic issues in", hi: "नागरिक समस्याएँ दर्ज करें" },
    "landing.heroTitle2": { en: "under 60 seconds.", hi: "60 सेकंड से भी कम में।" },
    "landing.heroSubtitle": {
        en: "Potholes, broken streetlights, or waste accumulation? Tell us what's wrong, and track its resolution in real-time. Transparent, fast, and accountable.",
        hi: "गड्ढे, टूटी स्ट्रीटलाइट्स, या कचरे का ढेर? हमें बताएं कि क्या समस्या है, और रीयल-टाइम में इसका समाधान ट्रैक करें। पारदर्शी, तेज़ और जवाबदेह।",
    },
    "landing.reportBtn": { en: "Report an Issue", hi: "शिकायत दर्ज करें" },
    "landing.exploreBtn": { en: "Explore Map", hi: "मानचित्र देखें" },
    "landing.trackBtn": { en: "Track Status", hi: "स्थिति ट्रैक करें" },

    // How it works
    "landing.step1Title": { en: "Snap & Report", hi: "फोटो लें और शिकायत करें" },
    "landing.step1Desc": {
        en: "Take a photo, select the category, and drop a pin on the map. It takes less than a minute.",
        hi: "एक फोटो लें, श्रेणी चुनें, और मानचित्र पर पिन लगाएं। इसमें एक मिनट से भी कम लगता है।",
    },
    "landing.step2Title": { en: "Track Progress", hi: "प्रगति ट्रैक करें" },
    "landing.step2Desc": {
        en: "Get a unique tracking ID. Watch as your complaint moves from Submitted to In Progress to Resolved.",
        hi: "एक यूनिक ट्रैकिंग आईडी पाएं। अपनी शिकायत को सबमिट से प्रगति में और फिर समाधान तक ट्रैक करें।",
    },
    "landing.step3Title": { en: "See Resolution", hi: "समाधान देखें" },
    "landing.step3Desc": {
        en: "No black holes. Receive photo-proof once the municipality has fixed the issue.",
        hi: "कोई अंधेरा नहीं। नगरपालिका द्वारा समस्या ठीक होने पर फोटो प्रमाण प्राप्त करें।",
    },

    // Features
    "landing.featuresTitle": { en: "Why CivicShakti?", hi: "CivicShakti क्यों?" },
    "landing.feat1Title": { en: "Real-time Tracking", hi: "रीयल-टाइम ट्रैकिंग" },
    "landing.feat1Desc": { en: "Track your complaint status from submission to resolution with live updates.", hi: "लाइव अपडेट के साथ अपनी शिकायत की स्थिति को सबमिशन से समाधान तक ट्रैक करें।" },
    "landing.feat2Title": { en: "AI-Powered Priority", hi: "AI संचालित प्राथमिकता" },
    "landing.feat2Desc": { en: "Our AI automatically prioritizes urgent issues so critical problems get fixed first.", hi: "हमारा AI स्वचालित रूप से तत्काल मुद्दों को प्राथमिकता देता है ताकि गंभीर समस्याओं को पहले ठीक किया जाए।" },
    "landing.feat3Title": { en: "SLA Monitoring", hi: "SLA निगरानी" },
    "landing.feat3Desc": { en: "Service Level Agreements ensure timely response. Escalation triggers automatically.", hi: "सर्विस लेवल एग्रीमेंट समय पर प्रतिक्रिया सुनिश्चित करते हैं। एस्केलेशन स्वचालित रूप से ट्रिगर होता है।" },
    "landing.feat4Title": { en: "Photo Evidence", hi: "फोटो प्रमाण" },
    "landing.feat4Desc": { en: "Attach photos when reporting and receive proof when resolved. Full transparency.", hi: "शिकायत करते समय फोटो संलग्न करें और समाधान होने पर प्रमाण प्राप्त करें। पूर्ण पारदर्शिता।" },
    "landing.feat5Title": { en: "Interactive Map", hi: "इंटरैक्टिव मानचित्र" },
    "landing.feat5Desc": { en: "See all reported issues near you on an interactive map. Avoid duplicate reports.", hi: "इंटरैक्टिव मानचित्र पर अपने पास की सभी रिपोर्ट की गई समस्याओं को देखें। डुप्लिकेट रिपोर्ट से बचें।" },
    "landing.feat6Title": { en: "Community Power", hi: "सामुदायिक शक्ति" },
    "landing.feat6Desc": { en: "Upvote issues that matter. The more votes, the higher the priority for municipal action.", hi: "महत्वपूर्ण मुद्दों को अपवोट करें। जितने अधिक वोट, नगरपालिका कार्रवाई के लिए उतनी अधिक प्राथमिकता।" },

    // Stats
    "landing.statComplaints": { en: "Complaints Filed", hi: "दर्ज शिकायतें" },
    "landing.statResolved": { en: "Issues Resolved", hi: "समाधान किए गए" },
    "landing.statAreas": { en: "Areas Covered", hi: "क्षेत्र कवर किए गए" },
    "landing.statResponseTime": { en: "Avg Response Time", hi: "औसत प्रतिक्रिया समय" },

    // CTA
    "landing.ctaTitle": { en: "Ready to make your city better?", hi: "क्या आप अपने शहर को बेहतर बनाने के लिए तैयार हैं?" },
    "landing.ctaSubtitle": { en: "Join thousands of citizens who are already making a difference.", hi: "उन हज़ारों नागरिकों से जुड़ें जो पहले से बदलाव ला रहे हैं।" },
    "landing.ctaBtn": { en: "Get Started — It's Free", hi: "शुरू करें — यह मुफ़्त है" },

    // ── Footer ───────────────────────────────────────
    "footer.description": {
        en: "A digital public infrastructure platform empowering citizens to report local issues and accelerating municipal response through transparency.",
        hi: "एक डिजिटल सार्वजनिक बुनियादी ढांचा मंच जो नागरिकों को स्थानीय मुद्दों की रिपोर्ट करने और पारदर्शिता के माध्यम से नगरपालिका प्रतिक्रिया में तेजी लाने में सशक्त बनाता है।",
    },
    "footer.platform": { en: "Platform", hi: "प्लेटफ़ॉर्म" },
    "footer.aboutUs": { en: "About Us", hi: "हमारे बारे में" },
    "footer.howItWorks": { en: "How It Works", hi: "कैसे काम करता है" },
    "footer.faqs": { en: "FAQs", hi: "सामान्य प्रश्न" },
    "footer.legalTrust": { en: "Legal & Trust", hi: "कानूनी और विश्वास" },
    "footer.privacyPolicy": { en: "Privacy Policy", hi: "गोपनीयता नीति" },
    "footer.terms": { en: "Terms of Service", hi: "सेवा की शर्तें" },
    "footer.accessibility": { en: "Accessibility Statement", hi: "पहुँच विवरण" },
    "footer.support": { en: "Support", hi: "सहायता" },
    "footer.contactSupport": { en: "Contact Support", hi: "सहायता से संपर्क करें" },
    "footer.trackIssue": { en: "Track an Issue", hi: "समस्या ट्रैक करें" },
    "footer.copyright": { en: "CivicShakti Platform. A civic technology initiative.", hi: "CivicShakti प्लेटफ़ॉर्म। एक नागरिक प्रौद्योगिकी पहल।" },

    // ── Common ───────────────────────────────────────
    "common.back": { en: "Back", hi: "वापस" },
    "common.loading": { en: "Loading...", hi: "लोड हो रहा है..." },
    "common.search": { en: "Search", hi: "खोजें" },
    "common.submit": { en: "Submit", hi: "जमा करें" },
    "common.cancel": { en: "Cancel", hi: "रद्द करें" },
    "common.login": { en: "Log In", hi: "लॉग इन" },
    "common.signup": { en: "Sign Up", hi: "साइन अप" },
    "common.email": { en: "Email Address", hi: "ईमेल पता" },
    "common.password": { en: "Password", hi: "पासवर्ड" },
    "common.fullName": { en: "Full Name", hi: "पूरा नाम" },
    "common.noAccount": { en: "Don't have an account? Sign up", hi: "खाता नहीं है? साइन अप करें" },
    "common.hasAccount": { en: "Already have an account? Log in", hi: "पहले से खाता है? लॉग इन करें" },

    // ── Login Page ───────────────────────────────────
    "login.welcomeBack": { en: "Welcome Back", hi: "वापसी पर स्वागत है" },
    "login.createAccount": { en: "Create Account", hi: "खाता बनाएं" },
    "login.loginDesc": { en: "Log in to track your complaints faster.", hi: "अपनी शिकायतों को तेज़ी से ट्रैक करने के लिए लॉग इन करें।" },
    "login.signupDesc": { en: "Sign up to start reporting issues in your city.", hi: "अपने शहर में समस्याओं की रिपोर्ट करना शुरू करने के लिए साइन अप करें।" },
    "login.authFailed": { en: "Authentication failed. Please check your credentials.", hi: "प्रमाणीकरण विफल रहा। कृपया अपनी साख जांचें।" },

    // ── About Page ───────────────────────────────────
    "about.title": { en: "About CivicShakti", hi: "CivicShakti के बारे में" },
    "about.subtitle": { en: "A digital public infrastructure platform built to bridge the gap between citizens and authorities through transparency, accountability, and speed.", hi: "पारदर्शिता, जवाबदेही और गति के माध्यम से नागरिकों और अधिकारियों के बीच की खाई को पाटने के लिए बनाया गया एक डिजिटल सार्वजनिक बुनियादी ढांचा मंच।" },
    "about.mission": { en: "Our Mission", hi: "हमारा मिशन" },
    "about.missionText": { en: "We believe that effective governance starts with being able to hear and respond to citizens clearly. Our mission is to establish a seamless, incorruptible pipeline for reporting civic issues, ensuring that every broken streetlight, neglected park, and pothole is documented, assigned, and resolved with photographic proof.", hi: "हमारा मानना है कि प्रभावी शासन नागरिकों को स्पष्ट रूप से सुनने और उनकी प्रतिक्रिया देने में सक्षम होने से शुरू होता है। हमारा मिशन नागरिक समस्याओं की रिपोर्टिंग के लिए एक सहज, भ्रष्टाचार-मुक्त पाइपलाइन स्थापित करना है, यह सुनिश्चित करना कि हर टूटी स्ट्रीटलाइट, उपेक्षित पार्क और गड्ढे का दस्तावेजीकरण, असाइनमेंट और फोटोग्राफिक प्रमाण के साथ समाधान हो।" },
    "about.forCitizens": { en: "For Citizens", hi: "नागरिकों के लिए" },
    "about.forCitizensText": { en: 'We remove the anxiety of the "black hole" complaint process. By tracking issues publically on a map and demanding status updates, citizens can finally see their tax dollars at work, restoring trust in public institutions.', hi: "हम 'ब्लैक होल' शिकायत प्रक्रिया की चिंता को दूर करते हैं। नक्शे पर सार्वजनिक रूप से समस्याओं पर नज़र रखने और स्थिति अपडेट की मांग करके, नागरिक अंततः अपने टैक्स के पैसे को काम करते हुए देख सकते हैं, जिससे सार्वजनिक संस्थानों में विश्वास बहाल होता है।" },
    "about.forAuthorities": { en: "For Authorities", hi: "अधिकारियों के लिए" },
    "about.forAuthoritiesText": { en: "We organize chaos. By leveraging automated AI triage, geospatial clustering, and strict escalation timelines, municipal workers receive prioritized, actionable intelligence rather than thousands of duplicate emails.", hi: "हम अव्यवस्था को व्यवस्थित करते हैं। स्वचालित एआई ट्राइएज, भू-स्थानिक क्लस्टरिंग और सख्त एस्केलेशन समयसीमा का लाभ उठाकर, नगरपालिका कर्मचारियों को हजारों डुप्लिकेट ईमेल के बजाय प्राथमिकता वाली, कार्रवाई योग्य जानकारी मिलती है।" },
    "about.commitmentTitle": { en: "Our Commitment to the Public Interest", hi: "सार्वजनिक हित के प्रति हमारी प्रतिबद्धता" },
    "about.commitmentSubtitle": { en: "CivicShakti is built on principles of open governance:", hi: "CivicShakti खुले शासन के सिद्धांतों पर बनाया गया है:" },
    "about.nonCommercial": { en: "Non-Commercial Focus:", hi: "गैर-व्यावसायिक फोकस:" },
    "about.nonCommercialText": { en: "We do not sell citizen data, nor do we run advertisements tracking user behavior.", hi: "हम नागरिक डेटा नहीं बेचते हैं, न ही हम उपयोगकर्ता व्यवहार पर नज़र रखने वाले विज्ञापन चलाते हैं।" },
    "about.radicalTransparency": { en: "Radical Transparency:", hi: "कट्टरपंथी पारदर्शिता:" },
    "about.radicalTransparencyText": { en: "Complaint statuses are logged immutably. When a complaint is closed, photographic evidence is mandatory.", hi: "शिकायत की स्थिति को अपरिवर्तनीय रूप से लॉग किया जाता है। जब कोई शिकायत बंद हो जाती है, तो फोटोग्राफिक साक्ष्य अनिवार्य होता है।" },
    "about.equitableAccess": { en: "Equitable Access:", hi: "समान पहुँच:" },
    "about.equitableAccessText": { en: "The platform is designed to be accessible on low-end devices and respects user privacy at all stages.", hi: "मंच को कम-अंत वाले उपकरणों पर सुलभ होने के लिए डिज़ाइन किया गया है और सभी चरणों में उपयोगकर्ता की गोपनीयता का सम्मान करता है।" },

    // ── How It Works Page ────────────────────────────
    "howItWorks.title": { en: "How It Works", hi: "यह कैसे काम करता है" },
    "howItWorks.subtitle": { en: "A transparent, three-step process to ensure civic issues are logged, assigned, and resolved efficiently.", hi: "नागरिक मुद्दों को दर्ज करने, सौंपने और कुशलतापूर्वक हल करने को सुनिश्चित करने के लिए एक पारदर्शी, तीन-चरणीय प्रक्रिया।" },
    "howItWorks.step1Title": { en: "Submit a Report", hi: "एक रिपोर्ट सबमिट करें" },
    "howItWorks.step1Desc": { en: "Start by taking a clear photo of the issue (e.g., a pothole or broken streetlight). Select the correct category, add a brief description, and drop a pin on the map to log the exact coordinates. Our AI triages your report before it is submitted.", hi: "समस्या की स्पष्ट तस्वीर (जैसे, एक गड्ढा या टूटी हुई स्ट्रीटलाइट) लेने से शुरुआत करें। सही श्रेणी का चयन करें, एक संक्षिप्त विवरण जोड़ें, और सटीक निर्देशांक लॉग करने के लिए मानचित्र पर एक पिन छोड़ें। हमारा AI सबमिट करने से पहले आपकी रिपोर्ट को ट्राइएज करता है।" },
    "howItWorks.step2Title": { en: "Review & Assignment", hi: "समीक्षा और असाइनमेंट" },
    "howItWorks.step2Desc": { en: 'Once submitted, you receive a unique Tracking ID. The report is automatically routed to the relevant municipal department based on the category and location. You can monitor the timeline status changing from "Submitted" to "In Progress".', hi: "एक बार सबमिट करने के बाद, आपको एक विशिष्ट ट्रैकिंग आईडी प्राप्त होती है। रिपोर्ट स्वचालित रूप से श्रेणी और स्थान के आधार पर संबंधित नगर निगम विभाग को भेज दी जाती है। आप टाइमलाइन स्थिति को 'सबमिट किया गया' से 'प्रगति पर' में बदलते हुए देख सकते हैं।" },
    "howItWorks.step3Title": { en: "Proof of Resolution", hi: "समाधान का प्रमाण" },
    "howItWorks.step3Desc": { en: 'When the issue is fixed, municipal staff are required to upload a photographic evidence of the resolved site. Only then is the complaint marked as "Resolved" on your dashboard and on the public map.', hi: "जब समस्या ठीक हो जाती है, तो नगर निगम कर्मचारियों को हल की गई साइट का फोटोग्राफिक प्रमाण अपलोड करना आवश्यक होता है। तभी शिकायत को आपके डैशबोर्ड और सार्वजनिक मानचित्र पर 'हल किया गया' के रूप में चिह्नित किया जाता है।" },
    "howItWorks.trustTitle": { en: "Community Trust Building", hi: "सामुदायिक विश्वास निर्माण" },
    "howItWorks.trustDesc": { en: 'Every resolved complaint increases your "Trust Score" as a reporting citizen, ensuring that highly engaged and accurate reporters have their future complaints prioritized in the triage queue.', hi: "प्रत्येक हल की गई शिकायत एक रिपोर्टिंग नागरिक के रूप में आपके 'ट्रस्ट स्कोर' को बढ़ाती है, यह सुनिश्चित करते हुए कि अत्यधिक व्यस्त और सटीक संवाददाताओं के भविष्य की शिकायतों को ट्राइएज कतार में प्राथमिकता दी जाती है।" },

    // ── FAQ Page ─────────────────────────────────────
    "faq.title": { en: "Frequently Asked Questions", hi: "अक्सर पूछे जाने वाले प्रश्न" },
    "faq.subtitle": { en: "Clear answers to common questions regarding accountability, privacy, and process.", hi: "जवाबदेही, गोपनीयता और प्रक्रिया के संबंध में सामान्य प्रश्नों के स्पष्ट उत्तर।" },

    // ── Contact Page ─────────────────────────────────
    "contact.title": { en: "Contact & Support", hi: "संपर्क एवं सहायता" },
    "contact.subtitle": { en: "We are here to help ensure your civic issues reach the right authorities and to provide technical assistance for the platform.", hi: "हम यह सुनिश्चित करने में मदद के लिए यहां हैं कि आपकी नागरिक समस्याएं सही अधिकारियों तक पहुंचें और मंच के लिए तकनीकी सहायता प्रदान करें।" },
    "contact.techSupport.title": { en: "Technical Support", hi: "तकनीकी सहायता" },
    "contact.techSupport.desc": { en: "Having trouble logging in? Found a bug on the website? Map not loading correctly? Reach out to our technical team for assistance with the platform itself.", hi: "लॉग इन करने में परेशानी हो रही है? वेबसाइट पर कोई बग मिला? नक्शा ठीक से लोड नहीं हो रहा है? मंच के संबंध में सहायता के लिए हमारी तकनीकी टीम से संपर्क करें।" },
    "contact.feedback.title": { en: "General Feedback", hi: "सामान्य प्रतिक्रिया" },
    "contact.feedback.desc": { en: "We constantly improve based on citizen and staff feedback. Have an idea for a new category or a way to improve the complaint tracking timeline? Let us know.", hi: "हम नागरिकों और कर्मचारियों की प्रतिक्रिया के आधार पर लगातार सुधार करते हैं। क्या आपके पास किसी नई श्रेणी या शिकायत ट्रैकिंग समयरेखा को बेहतर बनाने के तरीके के लिए कोई विचार है? हमें बताएं।" },
    "contact.escalation.title": { en: "Escalation Guidance", hi: "एस्केलेशन मार्गदर्शन" },
    "contact.escalation.desc1": { en: "CivicShakti routes complaints to the appropriate municipal department, but ", hi: "CivicShakti शिकायतों को उपयुक्त नगरपालिका विभाग को भेजता है, लेकिन " },
    "contact.escalation.desc2": { en: "we do not directly dispatch maintenance crews", hi: "हम सीधे रखरखाव दल नहीं भेजते हैं" },
    "contact.escalation.item1": { en: 'If your complaint has been marked as "Resolved" but the issue persists, you may reply directly to the confirmation email to trigger a manual review.', hi: 'यदि आपकी शिकायत को "हल किया गया" के रूप में चिह्नित किया गया है, लेकिन समस्या बनी रहती है, तो आप मैन्युअल समीक्षा को ट्रिगर करने के लिए सीधे पुष्टिकरण ईमेल का उत्तर दे सकते हैं।' },
    "contact.escalation.item2": { en: 'If an issue has remained "In Progress" beyond the 14-day Service Level Agreement (SLA), it is automatically escalated to the department supervisor. No further action is required from you.', hi: 'यदि कोई समस्या 14-दिन के सेवा स्तर समझौते (SLA) से परे "प्रगति पर" बनी हुई है, तो यह स्वचालित रूप से विभाग पर्यवेक्षक को एस्केलेट हो जाती है। आपकी ओर से आगे किसी कार्रवाई की आवश्यकता नहीं है।' },
    "contact.escalation.item3": { en: "For immediate emergencies (active fires, violent crimes, medical emergencies, collapsed structures), DO NOT USE THIS APP. Call your local emergency services (911/112) immediately.", hi: "तत्काल आपात स्थिति (सक्रिय आग, हिंसक अपराध, चिकित्सा आपात स्थिति, ढह गए ढांचे) के लिए, इस ऐप का उपयोग न करें। तुरंत अपनी स्थानीय आपातकालीन सेवाओं (112) को कॉल करें।" },
    "faq.stillHaveQuestions": { en: "Still have questions?", hi: "अभी भी प्रश्न हैं?" },
    "faq.contactSupportText": { en: "If you need further assistance or have an inquiry not listed here, please contact our support desk.", hi: "यदि आपको और सहायता की आवश्यकता है या यहां सूचीबद्ध नहीं की गई कोई पूछताछ है, तो कृपया हमारे सहायता डेस्क से संपर्क करें।" },
    "faq.contactSupportBtn": { en: "Contact Support", hi: "सहयोग के लिए संपर्क करें" },

    // FAQ Items
    "faq.q1": { en: "Who can submit complaints?", hi: "शिकायतें कौन दर्ज कर सकता है?" },
    "faq.a1": { en: "Any resident can submit a complaint. You will need to create a free citizen account, which helps us prevent spam and allows you to track your issues. We also accept basic anonymous reports, but these lack timeline tracking features.", hi: "कोई भी निवासी शिकायत दर्ज कर सकता है। आपको एक मुफ्त नागरिक खाता बनाना होगा, जो हमें स्पैम को रोकने में मदद करता है और आपको अपनी समस्याओं को ट्रैक करने की अनुमति देता है। हम बुनियादी अनाम रिपोर्ट भी स्वीकार करते हैं, लेकिन इनमें टाइमलाइन ट्रैकिंग सुविधाओं का अभाव होता है।" },
    "faq.q2": { en: "Is my identity protected?", hi: "क्या मेरी पहचान सुरक्षित है?" },
    "faq.a2": { en: "Yes. While you are required to log in to prevent misuse, your personal identity (name, email) is generally kept confidential from the public issue map. Municipal staff handle your data under strict data privacy regulations.", hi: "हाँ। हालाँकि आपको दुरुपयोग को रोकने के लिए लॉग इन करना आवश्यक है, आपकी व्यक्तिगत पहचान (नाम, ईमेल) को आम तौर पर सार्वजनिक समस्या मानचित्र से गोपनीय रखा जाता है। नगरपालिका कर्मचारी सख्त डेटा गोपनीयता नियमों के तहत आपके डेटा को संभालते हैं।" },
    "faq.q3": { en: "How long does resolution typically take?", hi: "समाधान में आमतौर पर कितना समय लगता है?" },
    "faq.a3": { en: "Resolution times depend entirely on the severity of the issue and the municipal department's current workload. Critical safety issues (like open manholes) are prioritized over cosmetic maintenance. You can track your issue's status in real-time.", hi: "समाधान का समय पूरी तरह से समस्या की गंभीरता और नगरपालिका विभाग के वर्तमान कार्यभार पर निर्भर करता है। कॉस्मेटिक रखरखाव पर गंभीर सुरक्षा समस्याओं (जैसे खुले मैनहोल) को प्राथमिकता दी जाती है। आप वास्तविक समय में अपनी समस्या की स्थिति को ट्रैक कर सकते हैं।" },
    "faq.q4": { en: "What types of issues are supported?", hi: "किस प्रकार की समस्याओं का समर्थन किया जाता है?" },
    "faq.a4": { en: "We currently accept reports for civic infrastructure: potholes, broken streetlights, illegal dumping/waste accumulation, water leakage, and public property damage. We do not handle emergency police or fire services.", hi: "हम वर्तमान में नागरिक बुनियादी ढांचे के लिए रिपोर्ट स्वीकार करते हैं: गड्ढे, टूटी स्ट्रीटलाइट, अवैध डंपिंग/कचरा जमा होना, पानी का रिसाव, और सार्वजनिक संपत्ति की क्षति। हम आपातकालीन पुलिस या अग्निशमन सेवाओं को नहीं संभालते हैं।" },
    "faq.q5": { en: "What happens if my complaint is rejected?", hi: "यदि मेरी शिकायत खारिज कर दी जाती है तो क्या होगा?" },
    "faq.a5": { en: "Complaints may be rejected if they are duplicates, outside municipal jurisdiction, or lack sufficient photographic evidence. If rejected, you will receive a specific reason from the staff and can resubmit with better evidence.", hi: "शिकायतों को खारिज किया जा सकता है यदि वे डुप्लिकेट हैं, नगरपालिका के अधिकार क्षेत्र से बाहर हैं, या पर्याप्त फोटोग्राफिक साक्ष्य का अभाव है। यदि खारिज कर दिया जाता है, तो आपको कर्मचारियों से एक विशिष्ट कारण प्राप्त होगा और बेहतर सबूत के साथ फिर से सबमिट कर सकते हैं।" },
    "faq.q6": { en: "How do you prevent misuse of the platform?", hi: "आप प्लेटफॉर्म के दुरुपयोग को कैसे रोकते हैं?" },
    "faq.a6": { en: "We utilize our AI validation pipeline to review uploaded images against the stated category. We also enforce rate-limits and calculate 'Trust Scores' for users. Serial submission of false reports leads to automated account suspension.", hi: "हम कथित श्रेणी के खिलाफ अपलोड की गई छवियों की समीक्षा करने के लिए अपने एआई सत्यापन पाइपलाइन का उपयोग करते हैं। हम दर-सीमा लागू करते हैं और उपयोगकर्ताओं के लिए 'ट्रस्ट स्कोर' की गणना करते हैं। झूठी रिपोर्टों के धारावाहिक सबमिशन से स्वचालित खाता निलंबन होता है।" },
    "faq.q7": { en: "Can I track the progress?", hi: "क्या मैं प्रगति को ट्रैक कर सकता हूँ?" },
    "faq.a7": { en: "Absolutely. Every complaint generates a unique Tracking ID. Enter this ID on our Tracking page, or view it from your Dashboard, to see a timeline of every action taken by the municipal staff.", hi: "बिल्कुल। प्रत्येक शिकायत एक अद्वितीय ट्रैकिंग आईडी उत्पन्न करती है। नगरपालिका कर्मचारियों द्वारा की गई प्रत्येक कार्रवाई की समयरेखा देखने के लिए इस आईडी को हमारे ट्रैकिंग पृष्ठ पर दर्ज करें, या इसे अपने डैशबोर्ड से देखें।" },

    // ── Status Labels ────────────────────────────────
    "status.pending": { en: "Pending", hi: "लंबित" },
    "status.in_progress": { en: "In Progress", hi: "प्रगति में" },
    "status.resolved": { en: "Resolved", hi: "समाधान" },
    "status.escalated": { en: "Escalated", hi: "बढ़ाया गया" },
    "status.reviewed": { en: "Under Review", hi: "समीक्षाधीन" },

    // ── Explore Page ─────────────────────────────────
    "explore.title": { en: "Neighborhood Watch Map", hi: "पड़ोस निगरानी मानचित्र" },
    "explore.subtitle": { en: "See what's already been reported in your area. This helps prevent duplicate reports and keeps our community informed about ongoing fixes.", hi: "देखें कि आपके क्षेत्र में पहले से क्या रिपोर्ट किया गया है। यह डुप्लिकेट रिपोर्ट को रोकने में मदद करता है और समुदाय को प्रगति के बारे में सूचित रखता है।" },
    "explore.info": { en: "Resolved issues are hidden from this view.", hi: "सुलझाए गए मुद्दे इस दृश्य से छिपे हुए हैं।" },

    // ── Track Page ───────────────────────────────────
    "track.title": { en: "Track your complaint", hi: "अपनी शिकायत ट्रैक करें" },
    "track.subtitle": { en: "Enter the tracking ID you received when you submitted your report to see its real-time status.", hi: "अपनी रिपोर्ट की रीयल-टाइम स्थिति देखने के लिए वह ट्रैकिंग आईडी दर्ज करें जो आपको सबमिट करते समय मिली थी।" },
    "track.placeholder": { en: "e.g. C-A74B9", hi: "जैसे C-A74B9" },
    "track.btn": { en: "Track Status", hi: "स्थिति ट्रैक करें" },

    // ── Report Page ──────────────────────────────────
    "report.title": { en: "Report an Issue", hi: "समस्या दर्ज करें" },
    "report.subtitle": { en: "Help us keep our city clean and safe. All reports are anonymous.", hi: "हमारे शहर को स्वच्छ और सुरक्षित रखने में मदद करें। सभी रिपोर्ट गुमनाम रहती हैं।" },
    "report.step1": { en: "Issue Type", hi: "समस्या का प्रकार" },
    "report.step2": { en: "Details", hi: "विवरण" },
    "report.step3": { en: "Submit", hi: "जमा करें" },
    "report.next": { en: "Continue", hi: "जारी रखें" },
    "report.back": { en: "Go Back", hi: "वापस जाएँ" },
    "report.photo": { en: "Add Photo", hi: "फोटो जोड़ें" },
    "report.photo_opt": { en: "Add Photo Evidence (Optional)", hi: "फोटो प्रमाण जोड़ें (वैकल्पिक)" },
    "report.desc": { en: "Description", hi: "विवरण" },
    "report.desc_placeholder": { en: "Please provide any additional details...", hi: "कृपया कोई भी अतिरिक्त विवरण प्रदान करें..." },
    "report.loc": { en: "Location", hi: "स्थान" },
    "report.category_select": { en: "Select the type of issue you're reporting", hi: "रिपोर्ट की जाने वाली समस्या का प्रकार चुनें" },
    "report.submitting": { en: "Submitting...", hi: "दर्ज हो रहा है..." },

    // Detailed Report Strings
    "report.header1": { en: "What's the issue?", hi: "क्या समस्या है?" },
    "report.header2": { en: "Where is it?", hi: "यह कहाँ है?" },
    "report.header3": { en: "Provide Details & Evidence", hi: "विवरण और प्रमाण प्रदान करें" },
    "report.header4": { en: "Review & Submit", hi: "समीक्षा और जमा करें" },
    "report.desc1": { en: "Classify the civic incident to ensure correct departmental routing.", hi: "सही विभाग में भेजने के लिए नागरिक घटना को वर्गीकृत करें।" },
    "report.desc2": { en: "Provide precise geographical coordinates or landmark references.", hi: "सटीक भौगोलिक निर्देशांक या सीमा-चिह्न संदर्भ प्रदान करें।" },
    "report.desc3": { en: "Visual evidence is optional but helps with rapid response. Detailed descriptions are mandatory for official documentation.", hi: "दृश्य प्रमाण वैकल्पिक है लेकिन त्वरित प्रतिक्रिया में मदद करता है। आधिकारिक दस्तावेज़ीकरण के लिए विस्तृत विवरण अनिवार्य हैं।" },
    "report.desc4": { en: "Review the final report details prior to formal submission.", hi: "औपचारिक रूप से जमा करने से पहले अंतिम रिपोर्ट के विवरण की समीक्षा करें।" },
    "report.address_label": { en: "Street Address / Landmark", hi: "सड़क का पता / मील का पत्थर" },
    "report.address_placeholder": { en: "e.g., Near Main Market Square", hi: "उदाहरण के लिए, मेन मार्केट स्क्वायर के पास" },
    "report.map_pin": { en: "Click map to drop pin", hi: "पिन छोड़ने के लिए मानचित्र पर क्लिक करें" },
    "report.visual_proof": { en: "Provide visual proof", hi: "दृश्य प्रमाण प्रदान करें" },
    "report.visual_proof_opt": { en: "(Optional)", hi: "(वैकल्पिक)" },
    "report.take_photo": { en: "Click to take photo", hi: "फोटो लेने के लिए क्लिक करें" },
    "report.drag_drop": { en: "or drag and drop here", hi: "या यहाँ खींचें और छोड़ें" },
    "report.additional_desc": { en: "Additional Description", hi: "अतिरिक्त विवरण" },
    "report.desc_placeholder_detail": { en: "Describe the issue in detail (mandatory)...", hi: "समस्या का विस्तार से वर्णन करें (अनिवार्य)..." },
    "report.review_cat": { en: "Category", hi: "श्रेणी" },
    "report.review_loc": { en: "Location", hi: "स्थान" },
    "report.review_det": { en: "Details", hi: "विवरण" },
    "report.not_selected": { en: "Not selected", hi: "चयनित नहीं" },
    "report.no_desc": { en: "No description provided.", hi: "कोई विवरण नहीं दिया गया।" },
    "report.photo_attached": { en: "Photo attached", hi: "संलग्न फोटो" },
    "report.edit": { en: "Edit", hi: "संपादित करें" },
    "report.auth_title": { en: "Authenticated Assigner", hi: "प्रमाणित असाइनर" },
    "report.auth_desc": { en: "This report will be tied to your verified account", hi: "यह रिपोर्ट आपके सत्यापित खाते से जुड़ी होगी" },
    "report.success": { en: "Official report successfully submitted.", hi: "आधिकारिक रिपोर्ट सफलतापूर्वक जमा की गई।" },
    "report.error": { en: "Failed to wrap up your complaint. Please try again.", hi: "आपकी शिकायत को पूरा करने में विफल। कृपया पुन: प्रयास करें।" },

    // ── Categories ───────────────────────────────────
    "category.pothole": { en: "Pothole", hi: "गड्ढा" },
    "category.garbage": { en: "Garbage", hi: "कचरा" },
    "category.water": { en: "Water Leak", hi: "पानी का रिसाव" },
    "category.electricity": { en: "Streetlight", hi: "सड़क की बत्ती" },
    "category.pollution": { en: "Pollution", hi: "प्रदूषण" },
    "category.infrastructure": { en: "Other", hi: "अन्य" },
};

export function t(key: string, lang: Language): string {
    return translations[key]?.[lang] || translations[key]?.en || key;
}

export default translations;
