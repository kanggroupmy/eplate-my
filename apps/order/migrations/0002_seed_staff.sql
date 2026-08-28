INSERT OR IGNORE INTO staff_users (
  id,
  username,
  password_hash,
  role,
  display_name,
  created_at
) VALUES
  ('staff_admin_seed', 'admin', 'CHANGE_ME_WITH_SCRIPT', 'Admin', 'Admin', datetime('now')),
  ('staff_installer_seed', 'installer', 'CHANGE_ME_WITH_SCRIPT', 'Installer', 'Installer', datetime('now'));
