#!/usr/bin/env bash
set -euo pipefail
phase="${1:?phase required}"
test "$(git branch --show-current)" = feat/matache-mvp
npm run typecheck
npm run build
npm test
printf '\n- Phase %s : typecheck, build et tests réussis.\n' "$phase" >> docs/BUILD_LOG.md
