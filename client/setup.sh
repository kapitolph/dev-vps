#!/usr/bin/env bash
# npdev client installer — idempotent
# Sets up the npdev CLI on a developer's local machine.
#
# Usage:
#   bash client/setup.sh

set -euo pipefail

info()  { printf '\033[1;34m▸ %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m  ✓ %s\033[0m\n' "$*"; }
warn()  { printf '\033[1;33m  ⚠ %s\033[0m\n' "$*"; }

# Detect repo root from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

if [[ ! -f "$REPO_DIR/machines.yaml" ]]; then
  echo "Error: Cannot find machines.yaml. Run this script from within the nextpay-dev-vps repo." >&2
  exit 1
fi

# ─── Step 1: Create config ───────────────────────────────────────────────────
info "Configuring npdev..."

mkdir -p "$HOME/.npdev"
cat > "$HOME/.npdev/config" << EOF
# npdev configuration — managed by client/setup.sh
REPO_DIR="$REPO_DIR"
EOF
ok "Config written to ~/.npdev/config (REPO_DIR=$REPO_DIR)"

# ─── Step 2: Symlink npdev to PATH ───────────────────────────────────────────
info "Installing npdev CLI..."

INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

ln -sf "$REPO_DIR/client/npdev" "$INSTALL_DIR/npdev"
chmod +x "$REPO_DIR/client/npdev"
ok "Symlinked $INSTALL_DIR/npdev → client/npdev"

# Check PATH
if ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
  warn "$INSTALL_DIR is not in your PATH."
  echo "  Add this to your shell config (~/.zshrc or ~/.bashrc):"
  echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo ""
  echo "  Then reload: source ~/.zshrc  (or restart your terminal)"
else
  ok "$INSTALL_DIR is in PATH"
fi

# ─── Step 3: Verify ──────────────────────────────────────────────────────────
info "Verifying..."

if command -v npdev &>/dev/null; then
  ok "npdev is available: $(npdev --version)"
else
  warn "npdev not yet on PATH (see above). After fixing PATH, test with: npdev --version"
fi

echo ""
echo "  Setup complete! Next steps:"
echo "  1. Ensure your SSH key is in keys/<your-name>.pub"
echo "  2. Test: npdev list"
echo ""
