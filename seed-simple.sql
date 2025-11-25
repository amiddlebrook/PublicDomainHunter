-- Simple seed data without apostrophes or special characters
-- Classic public domain works with monetization metrics

INSERT INTO Work (title, author, media_type, public_domain_year, original_publication_year, description, language, status)
VALUES 
  ('Frankenstein', 'Mary Shelley', 'book', 1818, 1818, 'Gothic novel about a scientist who creates a sapient creature', 'en', 'active'),
  ('Dracula', 'Bram Stoker', 'book', 1897, 1897, 'Gothic horror novel introducing Count Dracula', 'en', 'active'),
  ('The Strange Case of Dr Jekyll and Mr Hyde', 'Robert Louis Stevenson', 'book', 1886, 1886, 'Novella about dual personality', 'en', 'active'),
  ('A Christmas Carol', 'Charles Dickens', 'book', 1843, 1843, 'Story about the transformation of Ebenezer Scrooge', 'en', 'active'),
  ('The War of the Worlds', 'H.G. Wells', 'book', 1898, 1898, 'Science fiction novel about Martian invasion of Earth', 'en', 'active'),
  ('Alice in Wonderland', 'Lewis Carroll', 'book', 1865, 1865, 'Fantasy novel about a girl in a fantasy world', 'en', 'active'),
  ('The Picture of Dorian Gray', 'Oscar Wilde', 'book', 1890, 1890, 'Philosophical novel about vanity and morality', 'en', 'active'),
  ('The Call of Cthulhu', 'H.P. Lovecraft', 'book', 1928, 1928, 'Horror short story that created the Cthulhu Mythos', 'en', 'active'),
  ('Sherlock Holmes', 'Arthur Conan Doyle', 'book', 1887, 1887, 'First Sherlock Holmes detective story', 'en', 'active'),
  ('Heart of Darkness', 'Joseph Conrad', 'book', 1899, 1899, 'Novella about a voyage up the Congo River', 'en', 'active');

INSERT INTO WorkMetric (work_id, master_monetization_score, market_saturation_index, film_tv_potential, game_potential, merchandise_potential, audiobook_potential, book_republish_potential, gen_z_appeal, millennial_appeal, cross_platform_score, derivative_potential)
VALUES 
  (1, 92, 75, 95, 88, 90, 85, 75, 82, 88, 94, 96),
  (2, 95, 72, 98, 85, 92, 88, 78, 85, 90, 96, 95),
  (3, 85, 65, 88, 75, 80, 82, 70, 75, 82, 85, 90),
  (4, 98, 95, 95, 60, 98, 92, 88, 65, 85, 92, 85),
  (5, 90, 68, 95, 90, 85, 80, 72, 88, 90, 92, 92),
  (6, 96, 85, 92, 88, 98, 88, 82, 90, 88, 95, 94),
  (7, 88, 55, 90, 78, 82, 85, 75, 90, 92, 88, 88),
  (8, 93, 45, 88, 95, 90, 80, 78, 95, 88, 92, 96),
  (9, 97, 92, 98, 90, 95, 90, 85, 82, 90, 98, 98),
  (10, 82, 58, 85, 70, 68, 88, 75, 70, 80, 80, 78);
