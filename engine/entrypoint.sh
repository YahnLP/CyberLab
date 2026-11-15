#!/usr/bin/env bash
case "${MODE:-web}" in
    web) exec ttyd --writable --port "${TTYD_PORT:-7681}" -t titleFixed="CyberLab" -t fontSize=16 bash -l ;;
    tty) exec bash -l ;;
esac
