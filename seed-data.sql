-- Seed sample public domain works for testing
-- Classic literature with high monetization potential

-- Insert sample works
INSERT INTO Work (title, author, media_type, public_domain_year, original_publication_year, description, language, status)
VALUES 
  ('Frankenstein', 'Mary Shelley', 'book', 1818, 1818, 'Gothic novel about scientist Victor Frankenstein who creates a sapient creature. Themes of ambition, responsibility, and the consequences of playing God. Massive cultural impact with countless adaptations.', 'en', 'active'),
  ('Dracula', 'Bram Stoker', 'book', 1897, 1897, 'Gothic horror epistolary novel introducing Count Dracula. Defined the vampire genre and continues to influence media. Extremely high commercial value across all formats.', 'en', 'active'),
  ('The Strange Case of Dr Jekyll and Mr Hyde', 'Robert Louis Stevenson', 'book', 1886, 1886, 'Novella about a London legal practitioner who investigates strange occurrences between his friend and a murderous man. Iconic dual-personality concept.', 'en', 'active'),
  ('A Christmas Carol', 'Charles Dickens', 'book', 1843, 1843, 'Novella about the transformation of Ebenezer Scrooge. One of the most adapted stories in history. Seasonal evergreen with massive commercial potential.', 'en', 'active'),
  ('The War of the Worlds', 'H.G. Wells', 'book', 1898, 1898, 'Science fiction novel about Martian invasion of Earth. Pioneer of alien invasion genre. Highly adaptable to modern contexts.', 'en', 'active'),
  ('Alice''s Adventures in Wonderland', 'Lewis Carroll', 'book', 1865, 1865, 'Fantasy novel about a girl who falls down a rabbit hole into a fantasy world. Timeless appeal across all demographics. Massive merchandise potential.', 'en', 'active'),
  ('The Picture of Dorian Gray', 'Oscar Wilde', 'book', 1890, 1890, 'Philosophical novel about a man whose portrait ages while he remains young. Themes of vanity, morality, and hedonism resonate with modern audiences.', 'en', 'active'),
  ('The Call of Cthulhu', 'H.P. Lovecraft', 'book', 1928, 1928, 'Horror short story that created the Cthulhu Mythos. Cult following with strong game/merchandise potential. Rising popularity among Gen Z.', 'en', 'active'),
  ('Sherlock Holmes: A Study in Scarlet', 'Arthur Conan Doyle', 'book', 1887, 1887, 'First Sherlock Holmes story. The detective genre''s most enduring character. Endless adaptation possibilities.', 'en', 'active'),
  ('Heart of Darkness', 'Joseph Conrad', 'book', 1899, 1899, 'Novella about a voyage up the Congo River. Inspired Apocalypse Now. Powerful themes of imperialism and human nature.', 'en', 'active');

-- Insert corresponding metrics with realistic monetization scores
-- (Assuming the works were inserted with IDs 1-10)
INSERT INTO WorkMetric (
  work_id, 
  master_monetization_score, 
  market_saturation_index,
  film_tv_potential,
  game_potential,
  merchandise_potential,
  audiobook_potential,
  book_republish_potential,
  gen_z_appeal,
  millennial_appeal,
  gen_x_appeal,
  boomer_appeal,
  cross_platform_score,
  derivative_potential,
  calculation_version
)
VALUES 
  -- Frankenstein
  (1, 92, 75, 95, 88, 90, 85, 75, 82, 88, 85, 72, 94, 96, 'v1.0'),
  
  -- Dracula
  (2, 95, 72, 98, 85, 92, 88, 78, 85, 90, 88, 75, 96, 95, 'v1.0'),
  
  -- Dr Jekyll and Mr Hyde
  (3, 85, 65, 88, 75, 80, 82, 70, 75, 82, 80, 68, 85, 90, 'v1.0'),
  
  -- A Christmas Carol
  (4, 98, 95, 95, 60, 98, 92, 88, 65, 85, 92, 95, 92, 85, 'v1.0'),
  
  -- War of the Worlds
  (5, 90, 68, 95, 90, 85, 80, 72, 88, 90, 82, 70, 92, 92, 'v1.0'),
  
  -- Alice in Wonderland
  (6, 96, 85, 92, 88, 98, 88, 82, 90, 88, 85, 78, 95, 94, 'v1.0'),
  
  -- Dorian Gray
  (7, 88, 55, 90, 78, 82, 85, 75, 90, 92, 82, 65, 88, 88, 'v1.0'),
  
  -- Call of Cthulhu
  (8, 93, 45, 88, 95, 90, 80, 78, 95, 88, 75, 55, 92, 96, 'v1.0'),
  
  -- Sherlock Holmes
  (9, 97, 92, 98, 90, 95, 90, 85, 82, 90, 92, 85, 98, 98, 'v1.0'),
  
  -- Heart of Darkness  
  (10, 82, 58, 85, 70, 68, 88, 75, 70, 80, 85, 78, 80, 78, 'v1.0');
