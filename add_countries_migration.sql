-- ══════════════════════════════════════════════════════
-- Countries Migration — Full world countries for Live TV
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. Drop old table if exists and recreate with full schema
DROP TABLE IF EXISTS channel_countries;

CREATE TABLE channel_countries (
  id SERIAL PRIMARY KEY,
  name_ku TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  flag_url TEXT,
  is_active BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add country column to channels if not exists
ALTER TABLE channels ADD COLUMN IF NOT EXISTS country TEXT DEFAULT NULL;

-- 3. Insert countries (Middle East + Kurdistan region first, then world)
INSERT INTO channel_countries (name_ku, name_ar, name_en, flag_url, is_active, order_index) VALUES

-- ── Middle East & Kurdistan ──────────────────────────────────────────────────
('هەرێمی کوردستان', 'إقليم كردستان', 'Kurdistan Region', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_the_Kurdistan_Region.svg/320px-Flag_of_the_Kurdistan_Region.svg.png', true, 0),

('عێراق', 'العراق', 'Iraq', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Flag_of_Iraq.svg/320px-Flag_of_Iraq.svg.png', true, 1),

('تورکیا', 'تركيا', 'Turkey', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Flag_of_Turkey.svg/320px-Flag_of_Turkey.svg.png', true, 2),

('ئێران', 'إيران', 'Iran', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Flag_of_Iran.svg/320px-Flag_of_Iran.svg.png', true, 3),

('سوریا', 'سوريا', 'Syria', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Flag_of_Syria.svg/320px-Flag_of_Syria.svg.png', true, 4),

('عەرەبستانی سعوودی', 'المملكة العربية السعودية', 'Saudi Arabia', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Flag_of_Saudi_Arabia.svg/320px-Flag_of_Saudi_Arabia.svg.png', true, 5),

('فەڵەستین', 'فلسطين', 'Palestine', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Flag_of_Palestine.svg/320px-Flag_of_Palestine.svg.png', true, 6),

('ئیماراتی عەرەبی یەکگرتوو', 'الإمارات العربية المتحدة', 'UAE', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_United_Arab_Emirates.svg/320px-Flag_of_the_United_Arab_Emirates.svg.png', false, 7),

('قەتەر', 'قطر', 'Qatar', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Flag_of_Qatar.svg/320px-Flag_of_Qatar.svg.png', false, 8),

('کوەیت', 'الكويت', 'Kuwait', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Flag_of_Kuwait.svg/320px-Flag_of_Kuwait.svg.png', false, 9),

('ئوردون', 'الأردن', 'Jordan', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Flag_of_Jordan.svg/320px-Flag_of_Jordan.svg.png', false, 10),

('لوبنان', 'لبنان', 'Lebanon', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Flag_of_Lebanon.svg/320px-Flag_of_Lebanon.svg.png', false, 11),

('میسر', 'مصر', 'Egypt', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_Egypt.svg/320px-Flag_of_Egypt.svg.png', false, 12),

('لیبیا', 'ليبيا', 'Libya', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Libya.svg/320px-Flag_of_Libya.svg.png', false, 13),

('سوودان', 'السودان', 'Sudan', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_Sudan.svg/320px-Flag_of_Sudan.svg.png', false, 14),

('یەمەن', 'اليمن', 'Yemen', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Flag_of_Yemen.svg/320px-Flag_of_Yemen.svg.png', false, 15),

('بەحرەین', 'البحرين', 'Bahrain', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flag_of_Bahrain.svg/320px-Flag_of_Bahrain.svg.png', false, 16),

('عومان', 'عُمان', 'Oman', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Oman.svg/320px-Flag_of_Oman.svg.png', false, 17),

('تونس', 'تونس', 'Tunisia', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Tunisia.svg/320px-Flag_of_Tunisia.svg.png', false, 18),

('جەزایر', 'الجزائر', 'Algeria', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Algeria.svg/320px-Flag_of_Algeria.svg.png', false, 19),

('مەغریب', 'المغرب', 'Morocco', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flag_of_Morocco.svg/320px-Flag_of_Morocco.svg.png', false, 20),

('ئەفغانستان', 'أفغانستان', 'Afghanistan', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_the_Taliban.svg/320px-Flag_of_the_Taliban.svg.png', false, 21),

('پاکستان', 'باكستان', 'Pakistan', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Pakistan.svg/320px-Flag_of_Pakistan.svg.png', false, 22),

('ئازەربایجان', 'أذربيجان', 'Azerbaijan', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Azerbaijan.svg/320px-Flag_of_Azerbaijan.svg.png', false, 23),

-- ── Europe ──────────────────────────────────────────────────────────────────
('بریتانیا', 'المملكة المتحدة', 'United Kingdom', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Flag_of_the_United_Kingdom.svg/320px-Flag_of_the_United_Kingdom.svg.png', false, 30),

('ئەڵمانیا', 'ألمانيا', 'Germany', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_Germany.svg/320px-Flag_of_Germany.svg.png', false, 31),

('فەرەنسا', 'فرنسا', 'France', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/320px-Flag_of_France.svg.png', false, 32),

('ئیتالیا', 'إيطاليا', 'Italy', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Flag_of_Italy.svg/320px-Flag_of_Italy.svg.png', false, 33),

('هۆلەندا', 'هولندا', 'Netherlands', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/320px-Flag_of_the_Netherlands.svg.png', false, 34),

('سویدەن', 'السويد', 'Sweden', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Sweden.svg/320px-Flag_of_Sweden.svg.png', false, 35),

('نەروێژ', 'النرويج', 'Norway', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Norway.svg/320px-Flag_of_Norway.svg.png', false, 36),

('دانمارک', 'الدنمارك', 'Denmark', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Denmark.svg/320px-Flag_of_Denmark.svg.png', false, 37),

('روسیا', 'روسيا', 'Russia', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Russia.svg/320px-Flag_of_Russia.svg.png', false, 38),

('ئیسپانیا', 'إسبانيا', 'Spain', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Spain.svg/320px-Flag_of_Spain.svg.png', false, 39),

-- ── Americas ────────────────────────────────────────────────────────────────
('ئەمریکا', 'الولايات المتحدة الأمريكية', 'United States', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/320px-Flag_of_the_United_States.svg.png', false, 50),

('کەنەدا', 'كندا', 'Canada', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Canada.svg/320px-Flag_of_Canada.svg.png', false, 51),

('بەرازیل', 'البرازيل', 'Brazil', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Brazil.svg/320px-Flag_of_Brazil.svg.png', false, 52),

-- ── Asia ────────────────────────────────────────────────────────────────────
('چین', 'الصين', 'China', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_the_People%27s_Republic_of_China.svg/320px-Flag_of_the_People%27s_Republic_of_China.svg.png', false, 60),

('جاپون', 'اليابان', 'Japan', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Flag_of_Japan.svg/320px-Flag_of_Japan.svg.png', false, 61),

('هیندستان', 'الهند', 'India', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/320px-Flag_of_India.svg.png', false, 62),

('کۆریای باشووری', 'كوريا الجنوبية', 'South Korea', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/320px-Flag_of_South_Korea.svg.png', false, 63),

-- ── International ────────────────────────────────────────────────────────────
('نێودەوڵەتی', 'دولي', 'International', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Blank_Unrecognized_Flag.svg/320px-Blank_Unrecognized_Flag.svg.png', false, 99);
