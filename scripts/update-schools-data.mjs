import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qfwipqapomlbjgkqjuos.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmd2lwcWFwb21sYmpna3FqdW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI0NzE3NSwiZXhwIjoyMDkwODIzMTc1fQ.KFuPxW30J65quh5e27Pb5gZJoFmKQ9KCmlqnEWlbIDs'
)

// 2025-26 application cycle deadlines + test policies
// EA/REA/SCEA deadlines → deadline_ea field
// ED deadlines → deadline_ed field
// RD deadlines → deadline_rd field
// test_policy: 'required' | 'optional' | 'blind'
const schoolData = [
  // ── IVY LEAGUE ──────────────────────────────────────────────────────────────
  { name: 'Harvard University',                deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'required' },
  { name: 'Yale University',                   deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'required' },
  { name: 'Princeton University',              deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'required' },
  { name: 'Columbia University',               deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'University of Pennsylvania',        deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-05', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Brown University',                  deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-05', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Dartmouth College',                 deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-03', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'required' },
  { name: 'Cornell University',                deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },

  // ── MIT / STANFORD / CHICAGO ─────────────────────────────────────────────────
  { name: 'Massachusetts Institute of Technology', deadline_ea: '2025-11-01', deadline_ed: null,   deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-14', test_policy: 'required' },
  { name: 'Stanford University',               deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'University of Chicago',             deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'California Institute of Technology', deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-03', deadline_rolling: false, notification_date: '2026-03-14', test_policy: 'optional' },

  // ── TOP PRIVATE UNIVERSITIES ─────────────────────────────────────────────────
  { name: 'Duke University',                   deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Northwestern University',           deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-03', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Vanderbilt University',             deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Rice University',                   deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-04', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Washington University in St. Louis',deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Johns Hopkins University',          deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Georgetown University',             deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-10', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'University of Notre Dame',          deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'required' },
  { name: 'Carnegie Mellon University',        deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Emory University',                  deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Tufts University',                  deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Wake Forest University',            deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Tulane University of Louisiana',    deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-02-01', test_policy: 'optional' },
  { name: 'Brandeis University',               deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Case Western Reserve University',   deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-20', test_policy: 'optional' },
  { name: 'University of Rochester',           deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-05', deadline_rolling: false, notification_date: '2026-03-20', test_policy: 'optional' },
  { name: 'Lehigh University',                 deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'Rensselaer Polytechnic Institute',  deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'Stevens Institute of Technology',   deadline_ea: '2025-11-15', deadline_ed: '2025-11-01', deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },

  // ── NEW YORK / NORTHEAST ─────────────────────────────────────────────────────
  { name: 'New York University',               deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-05', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Boston University',                 deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'Boston College',                    deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-25', test_policy: 'optional' },
  { name: 'Northeastern University',           deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'optional' },
  { name: 'Fordham University',                deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Syracuse University',               deadline_ea: '2025-11-15', deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'Drexel University',                 deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'George Washington University',      deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-05', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'American University',               deadline_ea: '2025-11-15', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-20', test_policy: 'optional' },
  { name: 'Villanova University',              deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2025-12-15', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },

  // ── SOUTHERN PRIVATE ─────────────────────────────────────────────────────────
  { name: 'University of Southern California', deadline_ea: '2025-12-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'University of Miami',               deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-02-20', test_policy: 'optional' },
  { name: 'Southern Methodist University',     deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'Baylor University',                 deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },

  // ── WEST COAST PRIVATE ───────────────────────────────────────────────────────
  { name: 'University of San Francisco',       deadline_ea: '2025-11-15', deadline_ed: null,         deadline_rd: '2026-02-01', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'Santa Clara University',            deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Pepperdine University',             deadline_ea: '2025-11-15', deadline_ed: null,         deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Gonzaga University',                deadline_ea: '2025-11-15', deadline_ed: null,         deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'Loyola Marymount University',       deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'University of the Pacific',         deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-02-15', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },

  // ── UC SYSTEM (test blind, RD only Nov 30) ───────────────────────────────────
  { name: 'University of California-Berkeley', deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },
  { name: 'University of California-Los Angeles', deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },
  { name: 'University of California-San Diego', deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },
  { name: 'University of California-Santa Barbara', deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },
  { name: 'University of California-Davis',    deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },
  { name: 'University of California-Irvine',   deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },
  { name: 'University of California-Santa Cruz',deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },
  { name: 'University of California-Riverside', deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },
  { name: 'University of California-Merced',   deadline_ea: null, deadline_ed: null, deadline_rd: '2025-11-30', deadline_rolling: false, notification_date: '2026-03-31', test_policy: 'blind' },

  // ── TOP PUBLIC FLAGSHIPS ─────────────────────────────────────────────────────
  { name: 'University of Michigan-Ann Arbor',  deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'University of Virginia',            deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'University of North Carolina at Chapel Hill', deadline_ea: '2025-10-15', deadline_ed: null, deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'Georgia Institute of Technology-Main Campus', deadline_ea: '2025-10-15', deadline_ed: null, deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-14', test_policy: 'required' },
  { name: 'The University of Texas at Austin', deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2025-12-01', deadline_rolling: false, notification_date: '2026-03-01', test_policy: 'required' },
  { name: 'University of Wisconsin-Madison',   deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'required' },
  { name: 'University of Illinois Urbana-Champaign', deadline_ea: '2025-11-01', deadline_ed: null,  deadline_rd: '2025-12-01', deadline_rolling: false, notification_date: '2026-02-01', test_policy: 'required' },
  { name: 'Ohio State University-Main Campus',  deadline_ea: '2025-11-01', deadline_ed: null,        deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-03-01', test_policy: 'optional' },
  { name: 'Pennsylvania State University-Penn State University Park', deadline_ea: null, deadline_ed: null, deadline_rd: '2026-11-30', deadline_rolling: true, notification_date: null, test_policy: 'optional' },
  { name: 'Purdue University-Main Campus',     deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-02-01', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'Indiana University-Bloomington',    deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-03-01', test_policy: 'optional' },
  { name: 'University of Florida',             deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-11-01', deadline_rolling: false, notification_date: '2026-02-01', test_policy: 'required' },
  { name: 'University of Washington-Seattle Campus', deadline_ea: '2025-11-15', deadline_ed: null,  deadline_rd: '2025-12-01', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'University of Maryland-College Park',deadline_ea: '2025-11-01', deadline_ed: null,        deadline_rd: '2026-01-20', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'University of Georgia',             deadline_ea: '2025-10-15', deadline_ed: null,         deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-01', test_policy: 'required' },
  { name: 'Texas A&M University-College Station', deadline_ea: '2025-10-15', deadline_ed: null,      deadline_rd: '2025-12-01', deadline_rolling: false, notification_date: '2026-02-01', test_policy: 'required' },
  { name: 'University of Minnesota-Twin Cities',deadline_ea: null,        deadline_ed: null,         deadline_rd: '2026-12-15', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'Michigan State University',         deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-11-01', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'University of Pittsburgh-Pittsburgh Campus', deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'Rutgers University-New Brunswick',  deadline_ea: null,         deadline_ed: null,         deadline_rd: '2025-12-01', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'University of Connecticut',         deadline_ea: '2025-12-01', deadline_ed: null,         deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-01', test_policy: 'optional' },
  { name: 'Virginia Polytechnic Institute and State University', deadline_ea: '2025-11-01', deadline_ed: null, deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-01', test_policy: 'optional' },
  { name: 'University of Colorado Boulder',    deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-01-15', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'Arizona State University Campus Immersion', deadline_ea: null, deadline_ed: null,        deadline_rd: '2026-02-01', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'University of Arizona',             deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-05-01', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'University of Iowa',                deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-12-01', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'Iowa State University',             deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-07-01', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'The University of Tennessee-Knoxville', deadline_ea: '2025-11-01', deadline_ed: null,    deadline_rd: '2025-12-15', deadline_rolling: false, notification_date: '2026-02-01', test_policy: 'optional' },
  { name: 'North Carolina State University at Raleigh', deadline_ea: '2025-10-15', deadline_ed: null, deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-03-15', test_policy: 'optional' },
  { name: 'University of Oregon',              deadline_ea: null,         deadline_ed: null,         deadline_rd: '2026-01-15', deadline_rolling: true,  notification_date: null,          test_policy: 'optional' },
  { name: 'University of Utah',                deadline_ea: '2025-12-01', deadline_ed: null,         deadline_rd: '2026-04-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },

  // ── TOP LIBERAL ARTS COLLEGES ────────────────────────────────────────────────
  { name: 'Williams College',                  deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Amherst College',                   deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Swarthmore College',                deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-02', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Pomona College',                    deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-08', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Wellesley College',                 deadline_ea: '2025-11-01', deadline_ed: null,         deadline_rd: '2026-01-08', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Bowdoin College',                   deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-05', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Middlebury College',                deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Carleton College',                  deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Harvey Mudd College',               deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-05', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Claremont McKenna College',         deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-08', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Haverford College',                 deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Colgate University',                deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Hamilton College',                  deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Vassar College',                    deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Colby College',                     deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Bates College',                     deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Wesleyan University',               deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Grinnell College',                  deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Oberlin College',                   deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Davidson College',                  deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-10', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Kenyon College',                    deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Barnard College',                   deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-01', deadline_rolling: false, notification_date: '2026-03-28', test_policy: 'optional' },
  { name: 'Smith College',                     deadline_ea: '2025-11-15', deadline_ed: '2025-11-15', deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Mount Holyoke College',             deadline_ea: '2025-11-15', deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Bryn Mawr College',                 deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Trinity College',                   deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Colorado College',                  deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Scripps College',                   deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-08', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Pitzer College',                    deadline_ea: null,         deadline_ed: '2025-11-01', deadline_rd: '2026-01-08', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'blind' },
  { name: 'Lafayette College',                 deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Franklin and Marshall College',     deadline_ea: '2025-11-15', deadline_ed: '2025-11-15', deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
  { name: 'Furman University',                 deadline_ea: '2025-11-01', deadline_ed: '2025-11-01', deadline_rd: '2026-01-15', deadline_rolling: false, notification_date: '2026-03-01', test_policy: 'optional' },
  { name: 'Union College',                     deadline_ea: null,         deadline_ed: '2025-11-15', deadline_rd: '2026-02-01', deadline_rolling: false, notification_date: '2026-04-01', test_policy: 'optional' },
]

async function main() {
  // Fetch all schools from DB (paginate past the 1000-row default limit)
  const allSchools = []
  let from = 0
  while (true) {
    const { data, error } = await supabase.from('schools').select('id, name').range(from, from + 999)
    if (error) { console.error('Error fetching schools:', error.message); process.exit(1) }
    allSchools.push(...data)
    if (data.length < 1000) break
    from += 1000
  }

  const nameToId = {}
  for (const s of allSchools) nameToId[s.name] = s.id

  let updated = 0
  let notFound = []

  for (const school of schoolData) {
    const id = nameToId[school.name]
    if (!id) {
      notFound.push(school.name)
      continue
    }

    const { error: updateError } = await supabase
      .from('schools')
      .update({
        deadline_ea: school.deadline_ea,
        deadline_ed: school.deadline_ed,
        deadline_rd: school.deadline_rd,
        deadline_rolling: school.deadline_rolling,
        notification_date: school.notification_date,
        test_policy: school.test_policy,
      })
      .eq('id', id)

    if (updateError) {
      console.error(`Error updating ${school.name}:`, updateError.message)
    } else {
      updated++
      process.stdout.write(`\rUpdated ${updated}/${schoolData.length}...`)
    }
  }

  console.log(`\n\nDone! Updated ${updated} schools.`)
  if (notFound.length > 0) {
    console.log('\nNot found in DB (name mismatch):')
    notFound.forEach(n => console.log(`  - ${n}`))
  }
}

main().catch(err => { console.error(err); process.exit(1) })
