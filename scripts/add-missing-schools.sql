-- Add schools missing from the schools table.
-- Safe: only inserts schools that don't already exist (case-insensitive name match).

INSERT INTO public.schools (id, name, popular_majors, supplemental_essay_count, deadline_rolling)
SELECT gen_random_uuid(), v.name, '{}', 0, false
FROM (VALUES
  -- Top Liberal Arts Colleges
  ('Williams College'),
  ('Bowdoin College'),
  ('Swarthmore College'),
  ('Middlebury College'),
  ('Carleton College'),
  ('Haverford College'),
  ('Vassar College'),
  ('Bates College'),
  ('Bryn Mawr College'),
  ('Mount Holyoke College'),
  ('Oberlin College'),
  ('Smith College'),
  ('Wesleyan University'),
  ('Claremont McKenna College'),
  ('Harvey Mudd College'),
  ('Scripps College'),
  ('Pitzer College'),
  ('Reed College'),
  ('Franklin & Marshall College'),
  ('Allegheny College'),
  ('Kalamazoo College'),
  ('Beloit College'),
  ('Knox College'),
  ('Hobart and William Smith Colleges'),
  ('Earlham College'),
  ('Agnes Scott College'),
  ('Bennington College'),
  ('Hampshire College'),
  ('Goucher College'),
  ('New College of Florida'),
  ('Sewanee: The University of the South'),
  ('St. John''s College'),

  -- Top Research Universities / Private
  ('California Institute of Technology'),
  ('Northeastern University'),
  ('Vanderbilt University'),
  ('Tulane University'),
  ('University of Pennsylvania'),
  ('Brandeis University'),
  ('Rensselaer Polytechnic Institute'),
  ('Stevens Institute of Technology'),
  ('Embry-Riddle Aeronautical University'),

  -- Major Public Universities
  ('Pennsylvania State University'),
  ('Texas A&M University'),
  ('Ohio State University'),
  ('Rutgers University'),
  ('North Carolina State University'),
  ('University of Washington'),
  ('University of Minnesota'),
  ('University of North Carolina at Chapel Hill'),
  ('University of Iowa'),
  ('University of California, Berkeley'),
  ('University of California, Riverside'),
  ('University of Maryland, College Park'),
  ('University of Miami'),
  ('Arizona State University'),
  ('Virginia Tech'),
  ('Villanova University'),
  ('Louisiana State University'),
  ('Colorado State University'),
  ('Oklahoma State University'),
  ('Ohio University'),
  ('University of Missouri'),
  ('University of Nebraska'),
  ('University of Oklahoma'),
  ('University of Cincinnati'),
  ('University of Pittsburgh'),
  ('University of South Carolina'),
  ('University of New Hampshire'),
  ('University of Hawaii'),
  ('University of North Carolina, Charlotte'),
  ('University of New Mexico'),
  ('University of Colorado, Denver'),
  ('University of Maryland, Baltimore County'),
  ('Utah State University'),
  ('North Dakota State University'),
  ('Missouri State University'),
  ('Miami University'),
  ('Purdue University'),

  -- Public/Regional
  ('Bowling Green State University'),
  ('Kent State University'),
  ('University of Akron'),
  ('Wright State University'),
  ('University of Alaska, Anchorage'),
  ('University of Alaska, Fairbanks'),
  ('University of Wisconsin, Milwaukee'),
  ('New Mexico State University'),

  -- HBCUs
  ('Florida A&M University'),
  ('Spelman College'),
  ('Alabama A&M University'),
  ('Prairie View A&M University'),

  -- Military / Special Mission
  ('The Citadel'),

  -- CUNY Senior Colleges
  ('Baruch College'),
  ('City College of New York'),
  ('Hunter College'),
  ('Brooklyn College'),
  ('Queens College'),
  ('John Jay College of Criminal Justice'),
  ('New York City College of Technology'),
  ('College of Staten Island'),
  ('Lehman College'),
  ('Medgar Evers College'),
  ('York College'),

  -- SUNY Campuses
  ('SUNY New Paltz'),
  ('SUNY Oswego'),
  ('SUNY Cortland'),

  -- Cal State System
  ('California State University, Long Beach'),
  ('California State University, Fullerton'),
  ('California State University, Northridge'),
  ('California State University, Sacramento'),
  ('California State University, Fresno'),
  ('California State Polytechnic University, Pomona'),
  ('California State University, Los Angeles'),
  ('California State University, San Bernardino'),
  ('California State University, Chico'),
  ('California State Polytechnic University, Humboldt'),

  -- Other
  ('St. John''s University'),
  ('Saint Joseph''s University'),
  ('Fairleigh Dickinson University'),
  ('William Paterson University'),
  ('Texas A&M University, Corpus Christi')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.schools s WHERE lower(s.name) = lower(v.name)
);
