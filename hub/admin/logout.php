<?php
session_start();
session_destroy();
header('Location: /hub/admin/login.php');
exit;
