. "$LAB_LIB"
mkdir -p "$WORK/pages"
PAGES=(accueil login panier api admin aide); SEC=("Content-Security-Policy" "X-Content-Type-Options" "Strict-Transport-Security" "X-Frame-Options")
VAL=("default-src 'self'" "nosniff" "max-age=31536000; includeSubDomains" "DENY")
MANQ=""; ERR=""; NOHTTP=""
casing(){ case $((RANDOM%3)) in 0) echo "$1";; 1) echo "$1" | tr 'A-Z' 'a-z';; *) echo "$1";; esac; }
ERRPAGES=($(shuf -e "${PAGES[@]}" | head -2)); i=0
for p in "${PAGES[@]}"; do
  st="200 OK"; for e in "${ERRPAGES[@]}"; do if [ "$p" = "$e" ]; then case $((RANDOM%3)) in 0) st="403 Forbidden";; 1) st="404 Not Found";; *) st="500 Internal Server Error";; esac; ERR+="$p"$'\n'; fi; done
  { echo "HTTP/1.1 $st"; echo "Date: Sun, 15 Nov 2026 09:4$((i%10)):12 GMT"; echo "Server: nginx"; echo "Content-Type: text/html; charset=UTF-8"
    for k in 0 1 2 3; do
      if [ $((RANDOM%2)) = 0 ]; then echo "$(casing "${SEC[$k]}"): ${VAL[$k]}"; else MANQ+="$p;${SEC[$k]}"$'\n'; fi
    done
    if [ "$p" = login ] || [ "$p" = panier ] || [ "$p" = accueil ]; then
      case $p in login) cn=sid;; panier) cn=cart;; *) cn=pref;; esac
      fl="Path=/"; [ $((RANDOM%2)) = 0 ] && fl+="; Secure"
      if [ $((RANDOM%2)) = 0 ]; then fl+="; HttpOnly"; else NOHTTP+="$cn"$'\n'; fi
      [ $((RANDOM%2)) = 0 ] && fl+="; SameSite=Lax"
      echo "Set-Cookie: $cn=$(head -c 6 /dev/urandom | od -An -tx1 | tr -d ' \n'); $fl"
    fi
    echo; echo "<html><body>page $p</body></html>"; } > "$WORK/pages/$p.http"
  i=$((i+1))
done
save_set audit "${MANQ:-aucun}"; save_set pages_en_erreur "${ERR:-aucun}"; save_set cookies_sans_httponly "${NOHTTP:-aucun}"
