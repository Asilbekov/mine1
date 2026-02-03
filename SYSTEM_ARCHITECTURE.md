# Check Automation System - Architecture Map

## System Architecture Diagram

```mermaid
graph TB
    subgraph "User Environment"
        USER[👤 User]
        EXCEL[📊 Excel File<br/>14,626 checks]
        ZIP[📦 ZIP File<br/>АСИЛБЕКОВА.zip<br/>3.3 MB]
        PROGRESS[💾 progress.json<br/>Completed checks]
    end

    subgraph "Python Automation Script"
        MAIN[🤖 automate_checks.py<br/>Main orchestrator]
        CONFIG[⚙️ config.py<br/>Settings & tokens]
        GEMINI[🧠 gemini_ocr.py<br/>CAPTCHA solver]
        OCR[👁️ ocr_solver.py<br/>OCR utilities]
    end

    subgraph "External Services"
        GEMINI_API[🤖 Google Gemini API<br/>AI Vision Model]
        SERVER[🌐 my3.soliq.uz<br/>Tax Server]
    end

    subgraph "Server APIs"
        API_CAPTCHA[🔐 /get-captcha<br/>Fetch CAPTCHA]
        API_UPLOAD[📤 /repository-set-file<br/>Upload documents]
        API_SUBMIT[✅ /set-payment<br/>Submit check edit]
    end

    %% User Inputs
    USER -->|"Configure settings"| CONFIG
    USER -->|"Provide check list"| EXCEL
    USER -->|"Provide support doc"| ZIP
    USER -->|"Run script"| MAIN

    %% Script Internal Flow
    MAIN -->|"Load settings"| CONFIG
    MAIN -->|"Read check numbers"| EXCEL
    MAIN -->|"Load file content"| ZIP
    MAIN -->|"Check completed"| PROGRESS
    MAIN -->|"Save completed"| PROGRESS
    MAIN -->|"Request CAPTCHA solve"| GEMINI
    GEMINI -->|"Fallback OCR"| OCR

    %% Script to External Services
    CONFIG -->|"API Key"| GEMINI_API
    GEMINI -->|"HTTP POST<br/>Batch images"| GEMINI_API
    GEMINI_API -->|"JSON Response<br/>Solved digits"| GEMINI

    %% Script to Server
    MAIN -->|"HTTP GET<br/>Bearer token"| API_CAPTCHA
    API_CAPTCHA -->|"JSON Response<br/>CAPTCHA image + ID"| MAIN
    
    MAIN -->|"HTTP POST<br/>JSON payload<br/>Base64 file<br/>Bearer token"| API_UPLOAD
    API_UPLOAD -->|"JSON Response<br/>File GUID"| MAIN
    
    MAIN -->|"HTTP POST<br/>JSON payload<br/>File ID<br/>CAPTCHA solution<br/>Zero amounts<br/>Bearer token"| API_SUBMIT
    API_SUBMIT -->|"JSON Response<br/>Success/Error"| MAIN

    %% Connect APIs to Server
    API_CAPTCHA -.->|"Part of"| SERVER
    API_UPLOAD -.->|"Part of"| SERVER
    API_SUBMIT -.->|"Part of"| SERVER

    %% Styling
    classDef userClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef scriptClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef apiClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef serverClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef externalClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class USER,EXCEL,ZIP,PROGRESS userClass
    class MAIN,CONFIG,GEMINI,OCR scriptClass
    class API_CAPTCHA,API_UPLOAD,API_SUBMIT apiClass
    class SERVER serverClass
    class GEMINI_API externalClass
```

## Data Flow Summary

### 1️⃣ **Initialization Phase**
```
User → Config → Script
User → Excel → Script  
User → ZIP → Script
```

### 2️⃣ **Per Check Processing (×14,626)**
```
Script → Server: GET /get-captcha
       ← CAPTCHA image + ID

Script → Gemini API: POST (CAPTCHA image)
       ← Solved digits (6 digits)

Script → Server: POST /repository-set-file (ZIP file)
       ← File GUID

Script → Server: POST /set-payment (All data)
       ← Success/Error response

Script → progress.json: Save completed check
```

### 3️⃣ **Retry Logic**
```
CAPTCHA Error → Retry with new CAPTCHA (max 2 attempts)
Other Error → Skip (will retry on next run)
Duplicate (9099) → Mark as success
```

## Key Components

| Component | Purpose | Size/Count |
|-----------|---------|------------|
| `automate_checks.py` | Main automation logic | ~1,000 lines |
| `config.py` | Settings, tokens, URLs | Configuration |
| `gemini_ocr.py` | AI-powered CAPTCHA solving | Gemini Flash 2.0 |
| Excel file | Check numbers source | 14,626 rows |
| ZIP file | Support document | 3.3 MB |
| `progress.json` | Completed checks tracker | 275 checks |

## API Endpoints

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/home/get-captcha` | GET | Fetch CAPTCHA | Bearer token |
| `/file/repository-set-file` | POST | Upload document | Bearer token |
| `/check-edit/set-payment` | POST | Submit check edit | Bearer token |

## Success Metrics
- **Processed**: 275 checks
- **Success Rate**: 77.5%
- **CAPTCHA Failures**: 22.5%
- **Duplicates**: 1 check (0.4%)
- **Processing Speed**: 0.31-0.41 checks/sec
