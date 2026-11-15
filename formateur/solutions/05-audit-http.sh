#!/usr/bin/env bash
set -e
: > audit.txt; : > pages-en-erreur.txt; : > cookies-sans-httponly.txt
for f in pages/*.http; do p=$(basename "$f" .http)
  for h in Content-Security-Policy X-Content-Type-Options Strict-Transport-Security X-Frame-Options; do grep -qi "^$h:" "$f" || echo "$p;$h" >> audit.txt; done
  [ "$(head -n1 "$f" | awk '{print $2}')" -ge 400 ] && echo "$p" >> pages-en-erreur.txt
  c=$(grep -i '^Set-Cookie:' "$f" || true); [ -n "$c" ] && ! echo "$c" | grep -qi 'HttpOnly' && echo "$c" | sed 's/^[^:]*: *//;s/=.*//' >> cookies-sans-httponly.txt
done
for x in audit.txt pages-en-erreur.txt cookies-sans-httponly.txt; do [ -s $x ] || echo aucun > $x; done
