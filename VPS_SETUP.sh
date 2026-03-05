#!/usr/bin/env bash
# dev-vps: Shared VPS Setup Script
# Run this once with sudo on a fresh Ubuntu VPS to set up a shared dev environment.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/kapitolph/dev-vps/main/VPS_SETUP.sh | sudo bash
#   # or
#   sudo bash VPS_SETUP.sh
#
# What it does:
#   1. Creates a shared 'dev' user for pair programming via tmux
#   2. Installs: Bun, Volta, Node.js, Claude Code, Codex CLI
#   3. Authenticates with GitHub (interactive)
#   4. Clones the project repo into ~/nextpay
#   5. Sets up tmux-based persistent session management

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
SHARED_USER="dev"
SHARED_GROUP="developers"
REPO_URL="https://github.com/kapitolph/nextpay-v3.git"
REPO_DIR="/home/$SHARED_USER/nextpay"
VPS_DIR="/home/$SHARED_USER/.vps"

# ─── Helpers ──────────────────────────────────────────────────────────────────
info()  { printf '\n\033[1;34m▸ %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m  ✓ %s\033[0m\n' "$*"; }
warn()  { printf '\033[1;33m  ⚠ %s\033[0m\n' "$*"; }
fail()  { printf '\033[1;31m  ✗ %s\033[0m\n' "$*"; exit 1; }

need_root() {
  [[ $EUID -eq 0 ]] || fail "This script must be run as root (use sudo)."
}

run_as_dev() {
  sudo -u "$SHARED_USER" -i bash -c "$1"
}

# ─── Step 0: Preflight ───────────────────────────────────────────────────────
need_root

info "Checking prerequisites..."
for cmd in curl git; do
  command -v "$cmd" &>/dev/null || { apt-get update -qq && apt-get install -y -qq "$cmd"; }
  ok "$cmd"
done

# Install tmux if missing
if ! command -v tmux &>/dev/null; then
  apt-get update -qq && apt-get install -y -qq tmux
fi
ok "tmux $(tmux -V)"

# ─── Step 1: Create shared user ──────────────────────────────────────────────
info "Setting up shared user '$SHARED_USER'..."

# Create group if it doesn't exist
if ! getent group "$SHARED_GROUP" &>/dev/null; then
  groupadd "$SHARED_GROUP"
  ok "Created group '$SHARED_GROUP'"
else
  ok "Group '$SHARED_GROUP' already exists"
fi

# Create user if it doesn't exist
if ! id "$SHARED_USER" &>/dev/null; then
  useradd -m -s /bin/bash -g "$SHARED_GROUP" "$SHARED_USER"
  ok "Created user '$SHARED_USER'"
else
  ok "User '$SHARED_USER' already exists"
fi

# Set up SSH directory
mkdir -p "/home/$SHARED_USER/.ssh"
chmod 700 "/home/$SHARED_USER/.ssh"
touch "/home/$SHARED_USER/.ssh/authorized_keys"
chmod 600 "/home/$SHARED_USER/.ssh/authorized_keys"
chown -R "$SHARED_USER:$SHARED_GROUP" "/home/$SHARED_USER/.ssh"
ok "SSH directory ready"

# ─── Step 2: Collect SSH public keys ─────────────────────────────────────────
info "SSH public key setup"

# Collect keys from existing users on the system
EXISTING_KEYS=$(cat "/home/$SHARED_USER/.ssh/authorized_keys" 2>/dev/null | wc -l)
echo "  Currently $EXISTING_KEYS key(s) in authorized_keys."

# Check if there are other users with SSH keys we should import
for home_dir in /home/*/; do
  user=$(basename "$home_dir")
  [[ "$user" == "$SHARED_USER" ]] && continue
  if [[ -f "$home_dir/.ssh/authorized_keys" ]]; then
    while IFS= read -r key; do
      [[ -z "$key" || "$key" == \#* ]] && continue
      if ! grep -qF "$key" "/home/$SHARED_USER/.ssh/authorized_keys" 2>/dev/null; then
        echo "$key" >> "/home/$SHARED_USER/.ssh/authorized_keys"
        ok "Imported key from user '$user'"
      else
        ok "Key from '$user' already present"
      fi
    done < "$home_dir/.ssh/authorized_keys"
  fi
done

chown "$SHARED_USER:$SHARED_GROUP" "/home/$SHARED_USER/.ssh/authorized_keys"

# ─── Step 3: Install Bun ─────────────────────────────────────────────────────
info "Installing Bun..."
if run_as_dev "command -v bun &>/dev/null"; then
  ok "Bun already installed: $(run_as_dev 'bun --version')"
else
  run_as_dev 'curl -fsSL https://bun.sh/install | bash'
  ok "Bun installed: $(run_as_dev 'source ~/.bashrc && bun --version')"
fi

# ─── Step 4: Install Volta + Node.js ─────────────────────────────────────────
info "Installing Volta..."
if run_as_dev "command -v volta &>/dev/null"; then
  ok "Volta already installed: $(run_as_dev 'volta --version')"
else
  run_as_dev 'curl https://get.volta.sh | bash -s -- --skip-setup'
  ok "Volta installed"
fi

info "Installing Node.js via Volta..."
run_as_dev 'export VOLTA_HOME="$HOME/.volta" && export PATH="$VOLTA_HOME/bin:$PATH" && volta install node'
ok "Node.js installed: $(run_as_dev 'export VOLTA_HOME="$HOME/.volta" && export PATH="$VOLTA_HOME/bin:$PATH" && node --version')"

# ─── Step 5: Install Claude Code ─────────────────────────────────────────────
info "Installing Claude Code..."
if run_as_dev 'export VOLTA_HOME="$HOME/.volta" && export PATH="$VOLTA_HOME/bin:$PATH" && command -v claude &>/dev/null'; then
  ok "Claude Code already installed"
else
  run_as_dev 'export VOLTA_HOME="$HOME/.volta" && export PATH="$VOLTA_HOME/bin:$PATH" && npm install -g @anthropic-ai/claude-code'
  ok "Claude Code installed"
fi

# ─── Step 6: Install Codex CLI ───────────────────────────────────────────────
info "Installing Codex CLI..."
if run_as_dev 'export VOLTA_HOME="$HOME/.volta" && export PATH="$VOLTA_HOME/bin:$PATH" && command -v codex &>/dev/null'; then
  ok "Codex CLI already installed"
else
  run_as_dev 'export VOLTA_HOME="$HOME/.volta" && export PATH="$VOLTA_HOME/bin:$PATH" && npm install -g @openai/codex'
  ok "Codex CLI installed"
fi

# ─── Step 7: GitHub authentication ───────────────────────────────────────────
info "Setting up GitHub CLI..."

# Install gh if missing
if ! command -v gh &>/dev/null; then
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  apt-get update -qq && apt-get install -y -qq gh
  ok "GitHub CLI installed"
else
  ok "GitHub CLI already installed"
fi

info "GitHub authentication (interactive)..."
echo "  You'll authenticate as the shared 'dev' user."
echo "  This token will be used by all developers for git operations."
echo ""

if run_as_dev 'gh auth status &>/dev/null'; then
  ok "Already authenticated with GitHub"
else
  # Run gh auth login interactively — needs a real terminal
  sudo -u "$SHARED_USER" -i gh auth login
  ok "GitHub authenticated"
fi

# ─── Step 8: Clone repository ────────────────────────────────────────────────
info "Cloning repository..."
if [[ -d "$REPO_DIR/.git" ]]; then
  ok "Repository already cloned at $REPO_DIR"
  run_as_dev "cd $REPO_DIR && git pull --ff-only" || warn "Pull failed (probably has local changes)"
else
  run_as_dev "gh repo clone $REPO_URL $REPO_DIR"
  ok "Cloned to $REPO_DIR"
fi

# ─── Step 9: Install project dependencies ────────────────────────────────────
info "Installing project dependencies..."
run_as_dev "cd $REPO_DIR && source ~/.bashrc && bun install" || warn "bun install had issues (may need manual intervention)"
ok "Dependencies installed"

# ─── Step 10: Set up tmux session manager ────────────────────────────────────
info "Setting up tmux session manager..."

mkdir -p "$VPS_DIR"

cat > "$VPS_DIR/tmux.conf" << 'TMUX_CONF'
# Shared VPS session persistence layer
source-file -q ~/.tmux.conf

# Hide status bar -- tmux is invisible, just a persistence layer
set -g status off

# Detach when session is destroyed (don't switch to another session)
set -g detach-on-destroy on

# Ensure extended keys pass through (Shift+Enter etc.)
set -g extended-keys always
set -gs extended-keys-format csi-u
TMUX_CONF

cat > "$VPS_DIR/session.sh" << 'SESSION_SH'
#!/usr/bin/env bash
# VPS Session Manager -- manages tmux-backed persistent sessions for pair programming
# All developers share the same tmux sessions via the shared 'dev' user.
# Usage: session.sh <command> [args...]
# Commands: start, end, list, describe, reconcile, registry

set -euo pipefail

HOME_DIR="$HOME"
REPO_DIR="$HOME/nextpay"
REGISTRY="$HOME/.vps/sessions.yaml"
TMUX_CONF="$HOME/.vps/tmux.conf"
PATH="$HOME/.local/bin:$HOME/.bun/bin:$HOME/.volta/bin:$PATH"

# Ensure registry exists
if [[ ! -f "$REGISTRY" ]]; then
  mkdir -p "$(dirname "$REGISTRY")"
  printf '# VPS session registry -- managed by .vps/session.sh\nsessions: []\n' > "$REGISTRY"
fi

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

tmux_running() {
  tmux -f "$TMUX_CONF" has-session -t "$1" 2>/dev/null
}

registry_add() {
  local name="$1" type="$2" desc="$3" ts
  ts="$(timestamp)"
  sed -i 's/^sessions: \[\]$/sessions:/' "$REGISTRY"
  cat >> "$REGISTRY" <<EOF
  - name: $name
    type: $type
    description: "$desc"
    status: active
    created_at: "$ts"
    ended_at: null
EOF
}

registry_end() {
  local name="$1" ts
  ts="$(timestamp)"
  awk -v name="$name" -v ts="$ts" '
    BEGIN { last_line = 0 }
    /^  - name: / { current_name = $3 }
    /status: active/ && current_name == name { last_line = NR }
    { lines[NR] = $0 }
    END {
      for (i = 1; i <= NR; i++) {
        if (i == last_line) {
          sub(/status: active/, "status: ended", lines[i])
          print lines[i]
          getline_next = i + 1
          if (lines[getline_next] ~ /ended_at: null/) {
            lines[getline_next] = "    ended_at: \"" ts "\""
          }
        } else {
          print lines[i]
        }
      }
    }
  ' "$REGISTRY" > "${REGISTRY}.tmp" && mv "${REGISTRY}.tmp" "$REGISTRY"
}

registry_describe() {
  local name="$1" desc="$2"
  awk -v name="$name" -v desc="$desc" '
    /^  - name: / { current_name = $3; current_active = 0 }
    current_name == name && /status: active/ { current_active = 1 }
    current_name == name && current_active && /description:/ { target = NR }
    { lines[NR] = $0 }
    END {
      for (i = 1; i <= NR; i++) {
        if (i == target) {
          print "    description: \"" desc "\""
        } else {
          print lines[i]
        }
      }
    }
  ' "$REGISTRY" > "${REGISTRY}.tmp" && mv "${REGISTRY}.tmp" "$REGISTRY"
}

has_active_entry() {
  local name="$1"
  grep -A3 "name: $name$" "$REGISTRY" | grep -q "status: active"
}

cmd_start() {
  local name="$1" type="${2:-shell}" desc="${3:-}"

  # If tmux session already exists, just attach (pair programming!)
  if tmux_running "$name"; then
    exec tmux -f "$TMUX_CONF" attach-session -t "$name"
  fi

  # Prompt for description if not provided and interactive
  if [[ -z "$desc" ]] && [[ -t 0 ]]; then
    printf "Session description for '%s': " "$name"
    read -r desc
  fi
  [[ -z "$desc" ]] && desc="(no description)"

  # Reconcile stale sessions first
  cmd_reconcile quiet

  # Add registry entry
  registry_add "$name" "$type" "$desc"

  # Build the command for the tmux session
  local cmd
  case "$type" in
    shell)
      cmd="cd $REPO_DIR && exec \$SHELL -l"
      ;;
    claude)
      cmd="cd $REPO_DIR && claude --dangerously-skip-permissions"
      ;;
    codex)
      cmd="cd $REPO_DIR && codex --dangerously-bypass-approvals-and-sandbox"
      ;;
    *)
      echo "Unknown type: $type" >&2
      exit 1
      ;;
  esac

  # Create and attach
  tmux -f "$TMUX_CONF" new-session -d -s "$name" "$cmd"
  exec tmux -f "$TMUX_CONF" attach-session -t "$name"
}

cmd_end() {
  local name="$1"
  if tmux_running "$name"; then
    tmux -f "$TMUX_CONF" kill-session -t "$name"
  fi
  if has_active_entry "$name"; then
    registry_end "$name"
    echo "Session '$name' ended."
  else
    echo "No active registry entry for '$name'."
  fi
}

cmd_list() {
  echo "=== Active tmux sessions ==="
  tmux -f "$TMUX_CONF" ls 2>/dev/null || echo "(none)"
  echo ""
  echo "=== Session registry ==="
  awk '
    /^  - name:/ { printf "\n" }
    /name:/ && !/^#/ && !/sessions:/ { printf "  %-20s", $3 }
    /type:/ { printf "%-10s", $2 }
    /description:/ {
      sub(/^[[:space:]]*description: "?/, ""); sub(/"$/, "")
      printf "%-40s", $0
    }
    /status:/ { printf "%-10s", $2 }
    /created_at:/ { sub(/^[[:space:]]*created_at: "?/, ""); sub(/"$/, ""); printf "%s", $0 }
    /ended_at:/ && !/null/ { sub(/^[[:space:]]*ended_at: "?/, ""); sub(/"$/, ""); printf " -> %s", $0 }
    /ended_at: null/ { }
  ' "$REGISTRY"
  echo ""
}

cmd_reconcile() {
  local quiet="${1:-}"
  local changed=0
  local active_names
  active_names=$(awk '
    /^  - name:/ { name = $3 }
    /status: active/ { print name }
  ' "$REGISTRY" | sort -u)

  local sname
  for sname in $active_names; do
    if ! tmux_running "$sname"; then
      registry_end "$sname"
      changed=1
      [[ "$quiet" != "quiet" ]] && echo "Reconciled stale session: $sname" || true
    fi
  done

  if [[ "$quiet" != "quiet" ]] && [[ $changed -eq 0 ]]; then
    echo "All sessions in sync."
  fi
  return 0
}

cmd_describe() {
  local name="$1" desc="$2"
  if has_active_entry "$name"; then
    registry_describe "$name" "$desc"
    echo "Updated description for '$name'."
  else
    echo "No active session '$name' found."
  fi
}

cmd_registry() {
  cat "$REGISTRY"
}

# Main dispatch
case "${1:-}" in
  start)    shift; [[ $# -lt 1 ]] && { echo "Usage: session.sh start <name> <type> [description]" >&2; exit 1; }; cmd_start "$@" ;;
  end)      shift; [[ $# -lt 1 ]] && { echo "Usage: session.sh end <name>" >&2; exit 1; }; cmd_end "$1" ;;
  list)     cmd_list ;;
  describe) shift; [[ $# -lt 2 ]] && { echo "Usage: session.sh describe <name> <desc>" >&2; exit 1; }; cmd_describe "$1" "$2" ;;
  reconcile) cmd_reconcile ;;
  registry) cmd_registry ;;
  *)        echo "Usage: session.sh {start|end|list|describe|reconcile|registry} [args...]" >&2; exit 1 ;;
esac
SESSION_SH

chmod +x "$VPS_DIR/session.sh"
chown -R "$SHARED_USER:$SHARED_GROUP" "$VPS_DIR"

ok "Session manager installed at $VPS_DIR"

# ─── Step 11: Configure dev user's shell PATH ────────────────────────────────
info "Configuring shell environment..."

BASHRC="/home/$SHARED_USER/.bashrc"
if ! grep -q '# dev-vps PATH setup' "$BASHRC" 2>/dev/null; then
  cat >> "$BASHRC" << 'BASHRC_APPEND'

# dev-vps PATH setup
export VOLTA_HOME="$HOME/.volta"
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$VOLTA_HOME/bin:$HOME/.local/bin:$PATH"

# Convenience: end current tmux session
vps-end() {
  local session_name
  session_name=$(tmux display-message -p '#S' 2>/dev/null) || { echo "Not in a tmux session."; return 1; }
  bash ~/.vps/session.sh end "$session_name"
}
BASHRC_APPEND
  ok "PATH configured in .bashrc"
else
  ok "PATH already configured"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
info "Setup complete!"
echo ""
echo "  Shared user:    $SHARED_USER"
echo "  Repository:     $REPO_DIR"
echo "  Session script: $VPS_DIR/session.sh"
echo ""
echo "  Next steps for each developer:"
echo "  1. Add their SSH public key to /home/$SHARED_USER/.ssh/authorized_keys"
echo "  2. Run the client-prompt.md instructions to set up local aliases"
echo ""
echo "  To add a new developer's key:"
echo "    echo 'ssh-ed25519 AAAA...' >> /home/$SHARED_USER/.ssh/authorized_keys"
echo ""
