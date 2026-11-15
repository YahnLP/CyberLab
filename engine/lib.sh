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
