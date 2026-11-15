#!/usr/bin/env bash
save_answer() { printf '%s' "$1" | sha256sum | awk '{print $1}' > "$ANSWER_FILE"; }
check_answer() {
    local given="${1:-}"
    [ -z "$given" ] && { echo "  Ce défi attend une réponse : defi valider VOTRE_REPONSE"; return 1; }
    local h; h=$(printf '%s' "$given" | sha256sum | awk '{print $1}')
    [ "$h" = "$(cat "$ANSWER_FILE")" ]
}
ok() { echo "  ✔ $*"; }
ko() { echo "  ✘ $*"; return 1; }

# --- Aides pour défis à constats multiples (réponses hachées, ensembles comparés) ---
hash_of() { printf '%s' "$1" | sha256sum | cut -d' ' -f1; }
truth_get() { grep -m1 "^$1:" "$ANSWER_FILE" | cut -d: -f2-; }
given_get() { grep -m1 "^$1=" "$WORK/reponses.txt" 2>/dev/null | cut -d= -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'; }
norm_set() { tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;/^$/d' | sort -u; }
norm_list() { tr 'A-Z' 'a-z' | sed 's/è/e/g;s/é/e/g' | tr -d ' ' | tr ',' '\n' | sed '/^$/d' | sort -u | paste -sd, -; }
# save_kv clé valeur · save_list clé "a,b,c" · save_set clé "multi\nligne"
save_kv()   { printf '%s:%s\n' "$1" "$(hash_of "$(printf '%s' "$2" | norm_list)")" >> "$ANSWER_FILE"; }
save_num()  { printf '%s:%s\n' "$1" "$(hash_of "$2")" >> "$ANSWER_FILE"; }
save_set()  { local s; s=$(printf '%s\n' "$2" | norm_set)
              printf '%s:%s\nn_%s:%s\n' "$1" "$(hash_of "$s")" "$1" "$(printf '%s\n' "$s" | sed '/^$/d' | wc -l)" >> "$ANSWER_FILE"; }
FAIL=0
check_num()  { local v; v=$(given_get "$1"); if [ -z "$v" ]; then echo "    ✘ $1 : non renseigné"; FAIL=1
               elif [ "$(hash_of "$v")" = "$(truth_get "$1")" ]; then echo "    ✔ $1"; else echo "    ✘ $1 : valeur incorrecte"; FAIL=1; fi; }
check_kv()   { local v; v=$(given_get "$1"); if [ -z "$v" ]; then echo "    ✘ $1 : non renseigné"; FAIL=1
               elif [ "$(hash_of "$(printf '%s' "$v" | norm_list)")" = "$(truth_get "$1")" ]; then echo "    ✔ $1"; else echo "    ✘ $1 : valeur incorrecte"; FAIL=1; fi; }
check_set()  { local f="$WORK/$2" got n; if [ ! -s "$f" ]; then echo "    ✘ $2 : absent ou vide"; FAIL=1; return; fi
               got=$(norm_set < "$f"); n=$(printf '%s\n' "$got" | wc -l)
               if [ "$(hash_of "$got")" = "$(truth_get "$1")" ]; then echo "    ✔ $2 ($n ligne(s))"
               else echo "    ✘ $2 : $n ligne(s) distincte(s), contenu incorrect (attendu : $(truth_get n_$1) ligne(s))"; FAIL=1; fi; }
phase() { printf '\n  \033[1m%s\033[0m\n' "$1"; }
finish() { echo; [ "$FAIL" = 0 ] && ok "$1" || exit 1; }
