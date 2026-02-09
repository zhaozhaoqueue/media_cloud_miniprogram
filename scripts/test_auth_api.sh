#!/usr/bin/env bash

set -u

BASE_URL="${BASE_URL:-http://localhost:8000}"
PROVIDER="${PROVIDER:-wechat_mini}"
WX_CODE="${WX_CODE:-test-code}"
ACCESS_CODE="${ACCESS_CODE:-test-access-code}"
NICKNAME="${NICKNAME:-Luka}"
AVATAR="${AVATAR:-https://example.com/avatar.jpg}"
MODE="${1:-full}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/test_auth_api.sh [login|register|full]

Env vars (optional):
  BASE_URL     default: http://localhost:8000
  PROVIDER     default: wechat_mini
  WX_CODE      default: test-code
  ACCESS_CODE  default: test-access-code
  NICKNAME     default: Luka
  AVATAR       default: https://example.com/avatar.jpg

Examples:
  bash scripts/test_auth_api.sh login
  ACCESS_CODE=your-code bash scripts/test_auth_api.sh register
  BASE_URL=http://localhost:8000 WX_CODE=abc123 bash scripts/test_auth_api.sh full
EOF
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

call_api() {
  local label="$1"
  local method="$2"
  local path="$3"
  local payload="${4:-}"
  local url="${BASE_URL}${path}"
  local response status body

  echo
  echo "========== ${label} =========="
  echo "URL: ${url}"
  echo "Method: ${method}"
  if [ -n "${payload}" ]; then
    echo "Payload: ${payload}"
    response="$(curl -sS -w '\n%{http_code}' -X "${method}" "${url}" -H 'Content-Type: application/json' -d "${payload}")"
  else
    response="$(curl -sS -w '\n%{http_code}' -X "${method}" "${url}")"
  fi

  status="${response##*$'\n'}"
  body="${response%$'\n'*}"

  echo "Status: ${status}"
  echo "Body:"
  echo "${body}"
}

check_health() {
  call_api "Health" "GET" "/api/v1/health"
}

test_login() {
  local payload
  payload="$(printf '{"provider":"%s","code":"%s"}' "$(json_escape "${PROVIDER}")" "$(json_escape "${WX_CODE}")")"
  call_api "Auth Login" "POST" "/api/v1/auth/login" "${payload}"
}

test_register() {
  local payload
  payload="$(printf '{"provider":"%s","code":"%s","accessCode":"%s","nickname":"%s","avatar":"%s"}' \
    "$(json_escape "${PROVIDER}")" \
    "$(json_escape "${WX_CODE}")" \
    "$(json_escape "${ACCESS_CODE}")" \
    "$(json_escape "${NICKNAME}")" \
    "$(json_escape "${AVATAR}")")"
  call_api "Auth Register" "POST" "/api/v1/auth/register" "${payload}"
}

main() {
  case "${MODE}" in
    login)
      check_health
      test_login
      ;;
    register)
      check_health
      test_register
      ;;
    full)
      check_health
      test_login
      test_register
      test_login
      ;;
    -h|--help|help)
      usage
      ;;
    *)
      echo "Unknown mode: ${MODE}"
      usage
      exit 1
      ;;
  esac
}

main
