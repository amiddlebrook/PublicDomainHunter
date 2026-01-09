-- Public Domain Hunter Schema v2.0
-- Expanded to support Patents, Trademarks, and diverse IP types
-- Migration from v1.0 (works-centric) to v2.0 (IP-asset-centric)

-- ============================================================================
-- PHASE 1: Add IP Asset Types to existing Work table (non-breaking)
-- ============================================================================

-- Expand media_type to support new IP types
-- Existing: book, document, image, audio, video
-- New: patent, trademark, scientific_paper, music_score, design, software, dataset

-- Add patent-specific columns to Work table
ALTER TABLE Work ADD COLUMN patent_number TEXT;
ALTER TABLE Work ADD COLUMN patent_type TEXT;  -- utility, design, plant, reissue
ALTER TABLE Work ADD COLUMN filing_date TEXT;
ALTER TABLE Work ADD COLUMN grant_date TEXT;
ALTER TABLE Work ADD COLUMN expiration_date TEXT;
ALTER TABLE Work ADD COLUMN inventors TEXT;  -- JSON array
ALTER TABLE Work ADD COLUMN assignee TEXT;
ALTER TABLE Work ADD COLUMN cpc_codes TEXT;  -- JSON array of CPC classification codes
ALTER TABLE Work ADD COLUMN claims_count INTEGER;
ALTER TABLE Work ADD COLUMN citation_count INTEGER;
ALTER TABLE Work ADD COLUMN abstract TEXT;

-- Add trademark-specific columns
ALTER TABLE Work ADD COLUMN registration_number TEXT;
ALTER TABLE Work ADD COLUMN serial_number TEXT;
ALTER TABLE Work ADD COLUMN mark_type TEXT;  -- word, design, combined, sound
ALTER TABLE Work ADD COLUMN trademark_status TEXT;  -- live, dead, cancelled, expired, abandoned
ALTER TABLE Work ADD COLUMN abandonment_date TEXT;
ALTER TABLE Work ADD COLUMN word_mark TEXT;
ALTER TABLE Work ADD COLUMN nice_classes TEXT;  -- JSON array of Nice classification integers
ALTER TABLE Work ADD COLUMN goods_services TEXT;  -- JSON array

-- Add scientific paper columns
ALTER TABLE Work ADD COLUMN doi TEXT;
ALTER TABLE Work ADD COLUMN pmid TEXT;
ALTER TABLE Work ADD COLUMN arxiv_id TEXT;
ALTER TABLE Work ADD COLUMN journal TEXT;
ALTER TABLE Work ADD COLUMN publication_date TEXT;
ALTER TABLE Work ADD COLUMN authors TEXT;  -- JSON array
ALTER TABLE Work ADD COLUMN keywords TEXT;  -- JSON array
ALTER TABLE Work ADD COLUMN oa_status TEXT;  -- gold, green, bronze, hybrid, closed

-- Add music-specific columns
ALTER TABLE Work ADD COLUMN composer TEXT;
ALTER TABLE Work ADD COLUMN opus_number TEXT;
ALTER TABLE Work ADD COLUMN instrumentation TEXT;  -- JSON array
ALTER TABLE Work ADD COLUMN duration_seconds INTEGER;
ALTER TABLE Work ADD COLUMN score_url TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_work_patent_number ON Work(patent_number);
CREATE INDEX IF NOT EXISTS idx_work_patent_type ON Work(patent_type);
CREATE INDEX IF NOT EXISTS idx_work_expiration_date ON Work(expiration_date);
CREATE INDEX IF NOT EXISTS idx_work_registration_number ON Work(registration_number);
CREATE INDEX IF NOT EXISTS idx_work_trademark_status ON Work(trademark_status);
CREATE INDEX IF NOT EXISTS idx_work_doi ON Work(doi);
CREATE INDEX IF NOT EXISTS idx_work_composer ON Work(composer);

-- ============================================================================
-- PHASE 2: Patent-specific metrics in WorkMetric table
-- ============================================================================

ALTER TABLE WorkMetric ADD COLUMN manufacturing_complexity REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN component_availability REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN regulatory_barriers REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN technology_readiness_level INTEGER;
ALTER TABLE WorkMetric ADD COLUMN licensing_potential REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN direct_manufacturing_score REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN improvement_patents_count INTEGER DEFAULT 0;
ALTER TABLE WorkMetric ADD COLUMN workaround_complexity REAL DEFAULT 0.0;

-- Trademark-specific metrics
ALTER TABLE WorkMetric ADD COLUMN mark_strength TEXT;  -- generic, descriptive, suggestive, arbitrary, fanciful
ALTER TABLE WorkMetric ADD COLUMN revival_risk REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN domain_availability REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN social_handle_availability REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN conflict_risk REAL DEFAULT 0.0;

-- Scientific paper metrics
ALTER TABLE WorkMetric ADD COLUMN citation_velocity REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN altmetric_score REAL DEFAULT 0.0;
ALTER TABLE WorkMetric ADD COLUMN practical_application_score REAL DEFAULT 0.0;

-- ============================================================================
-- PHASE 3: New tables for structured IP data
-- ============================================================================

-- Patent Claims table (normalized from Work)
CREATE TABLE IF NOT EXISTS PatentClaim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL,
    claim_number INTEGER NOT NULL,
    claim_type TEXT NOT NULL,  -- independent, dependent
    claim_text TEXT NOT NULL,
    parent_claim_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES Work(id),
    FOREIGN KEY (parent_claim_id) REFERENCES PatentClaim(id)
);

CREATE INDEX idx_patent_claim_work ON PatentClaim(work_id);
CREATE INDEX idx_patent_claim_type ON PatentClaim(claim_type);

-- Patent Citations table
CREATE TABLE IF NOT EXISTS PatentCitation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    citing_work_id INTEGER NOT NULL,
    cited_patent_number TEXT NOT NULL,
    cited_work_id INTEGER,  -- NULL if not in our database
    citation_type TEXT,  -- examiner, applicant
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citing_work_id) REFERENCES Work(id),
    FOREIGN KEY (cited_work_id) REFERENCES Work(id)
);

CREATE INDEX idx_citation_citing ON PatentCitation(citing_work_id);
CREATE INDEX idx_citation_cited ON PatentCitation(cited_patent_number);

-- Patent Drawings table
CREATE TABLE IF NOT EXISTS PatentDrawing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL,
    drawing_number INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    thumbnail_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES Work(id)
);

CREATE INDEX idx_drawing_work ON PatentDrawing(work_id);

-- CPC Classification lookup table
CREATE TABLE IF NOT EXISTS CPCClassification (
    code TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    parent_code TEXT,
    level INTEGER,  -- 1=section, 2=class, 3=subclass, 4=group, 5=subgroup
    definition TEXT
);

CREATE INDEX idx_cpc_parent ON CPCClassification(parent_code);
CREATE INDEX idx_cpc_level ON CPCClassification(level);

-- Nice Classification lookup table (for trademarks)
CREATE TABLE IF NOT EXISTS NiceClassification (
    class_number INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    example_goods_services TEXT  -- JSON array
);

-- ============================================================================
-- PHASE 4: Public Domain Calendar (entering PD this year)
-- ============================================================================

CREATE TABLE IF NOT EXISTS PublicDomainEntry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER,
    ip_type TEXT NOT NULL,  -- patent, copyright, trademark
    entry_year INTEGER NOT NULL,
    entry_date TEXT,
    jurisdiction TEXT DEFAULT 'US',
    reason TEXT,  -- expiration, abandonment, dedication, etc.
    original_term_years INTEGER,
    notable INTEGER DEFAULT 0,  -- Flag for notable/interesting entries
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES Work(id)
);

CREATE INDEX idx_pd_entry_year ON PublicDomainEntry(entry_year);
CREATE INDEX idx_pd_entry_type ON PublicDomainEntry(ip_type);
CREATE INDEX idx_pd_notable ON PublicDomainEntry(notable);

-- ============================================================================
-- PHASE 5: Technology Sector classification
-- ============================================================================

CREATE TABLE IF NOT EXISTS TechnologySector (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    description TEXT,
    cpc_codes TEXT,  -- JSON array of related CPC codes
    keywords TEXT,  -- JSON array of keywords
    FOREIGN KEY (parent_id) REFERENCES TechnologySector(id)
);

-- Pre-populate technology sectors
INSERT OR IGNORE INTO TechnologySector (name, description) VALUES
    ('Mechanical Engineering', 'Machines, tools, mechanical devices'),
    ('Electrical Engineering', 'Circuits, electronics, electrical systems'),
    ('Chemical Engineering', 'Chemical processes, materials, compounds'),
    ('Biotechnology', 'Biological systems, genetic engineering, pharmaceuticals'),
    ('Software & Computing', 'Software, algorithms, computer systems'),
    ('Medical Devices', 'Healthcare equipment, diagnostic tools, implants'),
    ('Consumer Products', 'Everyday products, household items'),
    ('Transportation', 'Vehicles, aerospace, marine'),
    ('Energy', 'Power generation, storage, distribution'),
    ('Agriculture', 'Farming equipment, crop science, food processing'),
    ('Construction', 'Building materials, construction methods'),
    ('Telecommunications', 'Communication systems, networking');

-- ============================================================================
-- PHASE 6: Saved Searches and Alerts for IP
-- ============================================================================

CREATE TABLE IF NOT EXISTS SavedSearch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    search_type TEXT NOT NULL,  -- patent, trademark, scientific, all
    query TEXT NOT NULL,
    filters TEXT,  -- JSON of filter settings
    alert_enabled INTEGER DEFAULT 0,
    alert_frequency TEXT DEFAULT 'weekly',  -- daily, weekly, monthly
    last_alert_sent TEXT,
    result_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE INDEX idx_saved_search_user ON SavedSearch(user_id);
CREATE INDEX idx_saved_search_alert ON SavedSearch(alert_enabled);

-- ============================================================================
-- PHASE 7: IP Portfolio tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS Portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS PortfolioItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    work_id INTEGER NOT NULL,
    notes TEXT,
    tags TEXT,  -- JSON array
    status TEXT DEFAULT 'watching',  -- watching, evaluating, pursuing, acquired
    priority INTEGER DEFAULT 0,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES Portfolio(id),
    FOREIGN KEY (work_id) REFERENCES Work(id)
);

CREATE INDEX idx_portfolio_user ON Portfolio(user_id);
CREATE INDEX idx_portfolio_item_portfolio ON PortfolioItem(portfolio_id);
CREATE INDEX idx_portfolio_item_work ON PortfolioItem(work_id);

-- ============================================================================
-- VIEWS for common queries
-- ============================================================================

-- Patents expiring soon
CREATE VIEW IF NOT EXISTS v_expiring_patents AS
SELECT
    w.*,
    wm.master_monetization_score,
    wm.market_saturation_index,
    wm.manufacturing_complexity,
    julianday(w.expiration_date) - julianday('now') as days_until_expiration
FROM Work w
LEFT JOIN WorkMetric wm ON w.id = wm.work_id
WHERE w.media_type = 'patent'
  AND w.expiration_date IS NOT NULL
  AND julianday(w.expiration_date) > julianday('now')
  AND julianday(w.expiration_date) < julianday('now') + 365
ORDER BY w.expiration_date ASC;

-- Abandoned trademarks (ripe for revival)
CREATE VIEW IF NOT EXISTS v_abandoned_trademarks AS
SELECT
    w.*,
    wm.master_monetization_score,
    wm.revival_risk,
    wm.domain_availability
FROM Work w
LEFT JOIN WorkMetric wm ON w.id = wm.work_id
WHERE w.media_type = 'trademark'
  AND w.trademark_status IN ('abandoned', 'dead', 'cancelled')
ORDER BY wm.master_monetization_score DESC;

-- High-value public domain entries this year
CREATE VIEW IF NOT EXISTS v_entering_public_domain AS
SELECT
    pde.*,
    w.title,
    w.author,
    w.media_type,
    w.description
FROM PublicDomainEntry pde
LEFT JOIN Work w ON pde.work_id = w.id
WHERE pde.entry_year = strftime('%Y', 'now')
ORDER BY pde.notable DESC, pde.entry_date ASC;

-- Top monetization opportunities by type
CREATE VIEW IF NOT EXISTS v_top_opportunities AS
SELECT
    w.id,
    w.title,
    w.author,
    w.media_type,
    w.patent_number,
    w.registration_number,
    wm.master_monetization_score,
    wm.market_saturation_index,
    wm.temporal_window_score,
    CASE w.media_type
        WHEN 'patent' THEN wm.direct_manufacturing_score
        WHEN 'trademark' THEN (100 - wm.revival_risk)
        ELSE wm.cross_platform_score
    END as type_specific_score
FROM Work w
INNER JOIN WorkMetric wm ON w.id = wm.work_id
WHERE w.status = 'active'
  AND wm.master_monetization_score >= 60
ORDER BY wm.master_monetization_score DESC;
