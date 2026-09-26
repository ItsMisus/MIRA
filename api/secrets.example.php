<?php
// Modello dei segreti. Copialo in api/secrets.php e compila i valori veri:
// api/secrets.php e' escluso da git e non va mai committato.
return [
    'db_host'    => 'localhost',
    'db_name'    => 'mira_ecommerce',
    'db_user'    => 'mira_app',
    'db_pass'    => '',
    'smtp_host'  => 'smtp.gmail.com',
    'smtp_port'  => 587,
    'smtp_user'  => '',
    'smtp_pass'  => '',   // App Password Gmail
    'jwt_secret' => '',   // php -r "echo bin2hex(random_bytes(32));"
    'site_url'   => 'http://localhost/mira_ecommerce',
    // Domini da cui il browser puo' chiamare l'API.
    'allowed_origins' => ['http://localhost', 'http://127.0.0.1'],
];
