#!/usr/bin/env bash
# Construit les données du simulateur web puis lance tous ses tests. Usage : tests/web/run-all.sh [NB_VARIANTES]
set -e
cd "$(dirname "$0")/../.."
VARIANTS="${1:-6}" node tools/build-site-data.mjs >/dev/null
node tests/web/run.mjs
node tests/web/diff-bash.mjs
node tests/web/diff-ssh.mjs
node tests/web/e2e-01.mjs
node tests/web/twin.mjs 40
