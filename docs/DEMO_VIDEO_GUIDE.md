# 🎥 Complete Demo Video Recording Script & Guide
### Project: MySQL AI Chatbot — Enterprise SQL Workspace

या गाईडमध्ये **२ ते ३ मिनिटांचा व्यावसायिक डेमो व्हिडिओ** कसा रेकॉर्ड करावा, नक्की कोणत्या स्टेप्स दाखवाव्यात, आणि स्क्रीनवर काय बोलावे / दाखवावे याची सविस्तर स्क्रिप्ट दिली आहे.

---

## 🛠️ 1. Recording Setup & Tools

- **Screen Recorder:** 
  - [Loom](https://www.loom.com/) (सर्वात सोपे – थेट शेअर करता येणारी लिंक मिळते)
  - किंवा **OBS Studio** (1080p, 60fps)
  - किंवा Windows इन-बिल्ट स्क्रीन रेकॉर्डर (`Win + Alt + R` किंवा `Win + G`)
- **Browser:** Chrome / Edge मध्ये Fullscreen (`F11`) करा.
- **सर्व्हर्स चालू ठेवा:**
  - Backend: `http://localhost:5000` (`npm run dev`)
  - Frontend: `http://localhost:5173` (`npm run dev`)

---

## ⏱️ 2. Step-by-Step Recording Script (0:00 to 2:45)

### 🎬 Scene 1: Introduction & Login Screen (0:00 – 0:30)
- **काय दाखवायचे:**
  - `http://localhost:5173/login` वर या.
  - डाव्या बाजूचे हाय-टेक **MySQL Datacenter Background**, **MySQL 8.0 Dolphin Logo**, आणि "MySQL AI Chatbot" दाखवा.
  - उजव्या बाजूचे **Workspace Role Pills (Admin, Writer, Reader)** दाखवा.
- **काय बोलायचे (Voiceover / Explanation):**
  > "Hello everyone! This is my project — **MySQL AI Chatbot**, an enterprise-grade conversational database platform powered by Gemini LLM, LangChain, and MySQL 8.0 with strict Multi-Role RBAC security."

---

### 🎬 Scene 2: Role 1 — Reader Walkthrough (0:30 – 1:15)
- **काय दाखवायचे:**
  1. Login स्क्रीनवर **`Reader`** पिलवर क्लिक करा (क्रेडेंशियल्स `reader@aisql.com` आपोआप भरले जातील).
  2. **`LOGIN`** वर क्लिक करा.
  3. Reader डॅशबोर्ड उघडेल (वरती 'Reader', 'Strict Read-Only Mode' आणि 'SELECT Only' बॅज दिसेल).
  4. खालील प्रश्न चॅटमध्ये विचारा:
     ```text
     Show all products with price greater than 5000
     ```
     - **निकालावर फोकस करा:** AI क्वेरी जनरेट करेल, लगेच रन होईल आणि खाली सुंदर डेटा टेबल व स्पष्टीकरण दिसेल.
  5. **आता सिक्युरिटी ब्लॉक दाखवा:**
     ```text
     Delete all inactive customers
     ```
     - **निकालावर फोकस करा:** बॅकएंड हे त्वरित ब्लॉक करेल आणि मेसेज येईल:  
       > `❌ Security Policy Violation: Your reader role cannot execute DELETE queries.`
  6. प्रोफाइल आयकॉनवर क्लिक करून **Sign Out** करा.

---

### 🎬 Scene 3: Role 2 — Writer Walkthrough (1:15 – 2:00)
- **काय दाखवायचे:**
  1. Login स्क्रीनवर **`Writer`** पिलवर क्लिक करा (`writer@aisql.com`).
  2. **`LOGIN`** वर क्लिक करा.
  3. Writer डॅशबोर्ड दिसेल (Insert, Update, Delete परवानगी).
  4. सामान्य प्रश्न विचारा:
     ```text
     Show total orders placed this week
     ```
     - लगेच `SELECT` चालून रिझल्ट येईल (कोणतेही कन्फर्मेशन न मागता).
  5. **आता Destructive Confirmation Guard दाखवा:**
     ```text
     Delete customers whose status is inactive
     ```
     - **निकालावर फोकस करा:** AI क्वेरी थेट रन न करता चॅटमध्ये लाल रंगाचे गार्ड कार्ड उघडेल:  
       > `⚠️ Confirmation Required to Run DELETE: This query will alter or remove records in database ai_sql_assistant.`
     - **`Confirm & Run DELETE`** वर क्लिक करा.
     - हिरवा बॅनर दिसेल: `Successfully executed DELETE query. Affected rows: X`.
  6. **आता DDL ब्लॉक दाखवा:**
     ```text
     Drop table orders
     ```
     - **निकालावर फोकस करा:** Writer ला DDL ची परवानगी नसल्याने ब्लॉक होईल:  
       > `❌ Security Policy Violation: Your writer role cannot execute DROP queries.`
  7. **Sign Out** करा.

---

### 🎬 Scene 4: Role 3 — Admin Walkthrough (2:00 – 2:45)
- **काय दाखवायचे:**
  1. Login स्क्रीनवर **`Admin`** पिलवर क्लिक करा (`admin@aisql.com`).
  2. **`LOGIN`** करा.
  3. वरच्या हेडरमधील **Database Switcher** दाखवा (`ai_sql_assistant` वरून `ai_sql_warehouse` वर स्विच करून दाखवा).
  4. साइडबारमधून **Database Settings** टॅब उघडा.
  5. **Create New Database** वर क्लिक करा आणि `demo_store_db` तयार करून दाखवा.
  6. कार्डवर केवळ ॲडमिनसाठी असणारे **`Delete DB`** बटण दाखवा आणि कन्फर्मेशन मोडल दाखवून ड्रॉप करा.
  7. दाखवा की मुख्य `ai_sql_assistant` सुरक्षित आहे (तिथे Delete बटण येत नाही).

---

### 🎬 Scene 5: Security Architecture & Conclusion (2:45 – 3:00)
- **काय बोलायचे (Conclusion):**
  > "As you can see, this platform prevents SQL Injection via AST parsing, protects server resources with rate limiting, enforces least-privilege connection pools, and requires explicit human confirmation for any destructive queries."

---

## 📤 3. How to Embed Video in GitHub README

व्हिडिओ रेकॉर्ड केल्यानंतर:
1. **Option A (Loom किंवा YouTube - Recommended):**
   - व्हिडिओ YouTube वर (Unlisted किंवा Public) अथवा Loom वर अपलोड करा.
   - `README.md` फाईलमध्ये `YOUR_DEMO_VIDEO_LINK` च्या जागी तुमची खरी व्हिडिओ लिंक पेस्ट करा:
     ```markdown
     [![Watch Full Demo Video](https://img.shields.io/badge/▶_Watch_Full_Demo_Video-YouTube_/_Loom-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/YOUR_ACTUAL_LINK)
     ```
2. **Option B (Animated GIF):**
   - व्हिडिओचा १५-३० सेकंदांचा भाग [ezgif.com](https://ezgif.com/) द्वारे `.gif` मध्ये रुपांतरित करा.
   - ती फाईल `docs/screenshots/demo.gif` म्हणून सेव्ह करा.
   - `README.md` मध्ये थेट जोडा:
     ```markdown
     <img src="docs/screenshots/demo.gif" alt="MySQL AI Chatbot Demo" width="850" />
     ```
