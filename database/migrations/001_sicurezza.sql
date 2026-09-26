-- Da eseguire UNA volta su un database MIRA gia' esistente (phpMyAdmin > SQL).
-- Chi parte da zero importa database/schema.sql, che contiene gia' tutto.

-- Logout e cambio password invalidano i token gia' emessi.
ALTER TABLE `users` ADD COLUMN `token_version` int(11) NOT NULL DEFAULT 0 AFTER `is_admin`;

-- Le recensioni nuove aspettano l'approvazione dell'admin.
ALTER TABLE `reviews` ALTER COLUMN `is_approved` SET DEFAULT 0;

-- Freno ai tentativi (login, registrazione, contatti, recensioni).
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `bucket` varchar(150) NOT NULL,
  `hit_at` timestamp NOT NULL DEFAULT current_timestamp(),
  KEY `bucket_hit` (`bucket`,`hit_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La password dell'admin era salvata in chiaro: password_verify() non la
-- riconosce e il login admin non poteva funzionare. Si azzera qui e si
-- reimposta con: php tools/create-admin.php admin@mira.com
UPDATE `users` SET `password` = '!' WHERE `password` NOT LIKE '$2y$%' AND `password` NOT LIKE '$argon2%';

-- `products_backup` non e' piu' nello schema. Non viene cancellata qui:
-- se contiene dati che ti servono, controllala prima e poi eliminala a mano.
