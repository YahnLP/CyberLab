. "$LAB_LIB"
mkdir -p "$WORK/app"; FA=""; N=0
pick(){ [ $((RANDOM%2)) = 0 ]; }
# 1. recherche.php (XSS)
if pick; then V=1; else V=0; fi
{ echo '<?php'; echo '// Page de résultats de recherche du catalogue'; echo '$q = $_GET["q"] ?? "";'
  if [ $V = 1 ]; then echo 'echo "<h1>Résultats pour : " . $q . "</h1>";'; FA+="recherche.php;xss"$'\n'; else echo '// avant : echo $q directement (corrigé)'; echo 'echo "<h1>Résultats pour : " . htmlspecialchars($q, ENT_QUOTES, "UTF-8") . "</h1>";'; fi
  echo 'render_results(search($q));'; } > "$WORK/app/recherche.php"
# 2. login.php (SQLi)
if pick; then V=1; else V=0; fi
{ echo '<?php'; echo '// Authentification des utilisateurs'; echo '$hash = hash("sha256", $_POST["pass"]);'
  if [ $V = 1 ]; then echo '$sql = "SELECT id FROM users WHERE name = '"'"'" . $_POST["user"] . "'"'"' AND pass = '"'"'" . $hash . "'"'"'";'; echo '$res = $db->query($sql);'; FA+="login.php;sqli"$'\n'
  else echo '// avant : requête construite par concaténation (corrigé)'; echo '$stmt = $db->prepare("SELECT id FROM users WHERE name = ? AND pass = ?");'; echo '$stmt->bind_param("ss", $_POST["user"], $hash);'; echo '$stmt->execute();'; fi
  echo 'if ($res && $res->num_rows === 1) { start_session(); }'; } > "$WORK/app/login.php"
# 3. upload.php
if pick; then V=1; else V=0; fi
{ echo '<?php'; echo '// Téléversement de l'"'"'avatar'
  if [ $V = 1 ]; then echo 'move_uploaded_file($_FILES["f"]["tmp_name"], "uploads/" . $_FILES["f"]["name"]);'; FA+="upload.php;upload"$'\n'
  else echo '$ext = strtolower(pathinfo($_FILES["f"]["name"], PATHINFO_EXTENSION));'; echo 'if (!in_array($ext, ["png", "jpg", "gif"], true)) { http_response_code(400); exit; }'; echo 'move_uploaded_file($_FILES["f"]["tmp_name"], "/var/data/avatars/" . bin2hex(random_bytes(16)) . "." . $ext);'; fi; } > "$WORK/app/upload.php"
# 4. profil.php (CSRF)
if pick; then V=1; else V=0; fi
{ echo '<?php'; echo '// Changement d'"'"'adresse e-mail du compte connecté'; echo 'session_start();'
  if [ $V = 0 ]; then echo 'if (!hash_equals($_SESSION["csrf"], $_POST["csrf"] ?? "")) { http_response_code(403); exit; }'; fi
  echo 'if ($_SERVER["REQUEST_METHOD"] === "POST") {'; echo '  update_email($_SESSION["uid"], $_POST["email"]);'; echo '}'
  [ $V = 1 ] && FA+="profil.php;csrf"$'\n'; } > "$WORK/app/profil.php"
# au moins 2 failles : sinon on force login.php
if [ "$(printf '%s' "$FA" | grep -c .)" -lt 2 ]; then
  sed -i 's#^\$stmt = .*#$sql = "SELECT id FROM users WHERE name = '"'"'" . $_POST["user"] . "'"'"'";#;s#^\$stmt->bind_param.*#$res = $db->query($sql);#;/^\$stmt->execute/d' "$WORK/app/login.php"; grep -q 'login.php;sqli' <<< "$FA" || FA+="login.php;sqli"$'\n'
fi
save_set failles "$FA"; save_num nb_failles "$(printf '%s' "$FA" | grep -c .)"
save_kv correction_sqli requete-parametree; save_kv correction_xss echappement-sortie
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
nb_failles=
correction_sqli=
correction_xss=
R
