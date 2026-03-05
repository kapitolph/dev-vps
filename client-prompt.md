# Dev VPS Client Setup Prompt

> **For developers**: Paste everything below the line into your coding agent (Claude Code, Codex, etc.) to set up SSH access and session aliases for the shared dev VPS. This guide assumes macOS or Linux.

---

I need you to set up SSH access and tmux-based session aliases for a shared development VPS. Walk me through this step by step, asking for my preferences where noted. Do not skip steps or rush ahead — wait for my confirmation before proceeding to the next step.

## Context

- **VPS IP**: `13.250.2.78`
- **SSH Host alias**: `np-dev-box`
- **Shared user**: `dev` (all developers SSH as this user for pair programming via shared tmux sessions)
- **Session system**: The VPS runs a tmux session manager at `~/.vps/session.sh`. When two people connect to the same named session, they share the exact same terminal — this enables live pair programming.

## Step 1: SSH Key

First, check if I already have SSH key pairs (`~/.ssh/id_ed25519.pub`, `~/.ssh/vps/id_vps_ed25519.pub`, or similar). If I do, ask whether I want to reuse an existing key or generate a dedicated one for this VPS.

If generating a new key:
1. Create the directory: `mkdir -p ~/.ssh/vps && chmod 700 ~/.ssh/vps`
2. Ask me for my **email address** (suggest `firstname@nextfinancial.io` as the format)
3. Generate with: `ssh-keygen -t ed25519 -C "<my-email>" -f ~/.ssh/vps/id_vps_ed25519`
   - **Default to using a passphrase** for security (the key grants access to a shared server). Let me choose the passphrase interactively.
   - After generation, check if an ssh-agent is running (`ssh-add -l 2>/dev/null`). If not, start one (`eval $(ssh-agent -s)`).
   - Add the key to the agent: `ssh-add ~/.ssh/vps/id_vps_ed25519`
   - On macOS, for persistent keychain integration: `ssh-add --apple-use-keychain ~/.ssh/vps/id_vps_ed25519`

After the key is ready, print the full public key contents and tell me to send it to the VPS admin so they can add it to `/home/dev/.ssh/authorized_keys` on the server.

## Step 2: SSH Config

Before modifying `~/.ssh/config`:
- If the file doesn't exist, create it with `touch ~/.ssh/config && chmod 600 ~/.ssh/config`
- If it already contains a `Host np-dev-box` block, show me the existing block and ask if I want to replace it

Add this host entry (adjust `IdentityFile` to match wherever the key was generated or reused from). Add it **before** any trailing `Match` or wildcard `Host *` blocks:

```
Host np-dev-box
  HostName 13.250.2.78
  User dev
  IdentityFile ~/.ssh/vps/id_vps_ed25519
  IdentitiesOnly yes
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

The `ServerAliveInterval` keeps the connection from dropping during idle pair programming sessions.

Also add the VPS host key to known_hosts to avoid the first-connection prompt:

```bash
ssh-keyscan -t ed25519 -H 13.250.2.78 >> ~/.ssh/known_hosts 2>/dev/null
```

## Step 3: Shell Aliases

Ask me what **alias prefix** I want for the VPS commands. Suggestions:
- `npvps` (default — "NextPay VPS")
- `devbox`
- `np`

Then detect my shell (`$SHELL`) and target the correct config file:
- zsh → `~/.zshrc`
- bash on macOS → `~/.bash_profile` (or `~/.bashrc` if it exists and is sourced)
- bash on Linux → `~/.bashrc`

Before adding, check if the aliases already exist (search for `# BEGIN np-dev-box aliases`). If they do, ask if I want to replace them.

Wrap the aliases in sentinel comments for idempotency. Here is a **concrete example** using prefix `npvps` — if I chose a different prefix, substitute it in **all** function names, variable names, help text, usage strings, and variant names throughout the block (including inside the heredoc):

```bash
# BEGIN np-dev-box aliases
_npvps_HOST="dev@np-dev-box"

_npvps_validate_name() {
  if [[ ! "$1" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "Error: Session name must contain only letters, numbers, hyphens, and underscores."
    return 1
  fi
}

_npvps_session() {
  local type="$1"; shift
  if [[ $# -eq 0 ]]; then
    ssh -t "$_npvps_HOST" "exec \$SHELL -l"
    return
  fi
  local subcmd="$1"
  case "$subcmd" in
    --help|-h)
      cat <<'HELP'
Dev VPS Session Manager

Usage:
  npvps                          Quick shell (no tmux, no session tracking)
  npvps <name> [description]     Create or attach to named session
  npvps end <name>               End a session
  npvps list                     List all sessions
  npvps describe <name> <desc>   Update session description
  npvps sync                     Reconcile stale sessions
  npvps --help                   Show this help

Variants: npvpscc (Claude Code), npvpscx (Codex)

Pair programming: If someone else runs the same session name, you share the terminal.

Inside a session:
  Ctrl+B, D                    Detach (keep session alive)
HELP
      return ;;
    end)
      shift; [[ $# -lt 1 ]] && { echo "Usage: npvps end <name>"; return 1; }
      _npvps_validate_name "$1" || return 1
      ssh -t "$_npvps_HOST" "bash ~/.vps/session.sh end '$1'"; return ;;
    list)
      ssh "$_npvps_HOST" "bash ~/.vps/session.sh list"; return ;;
    describe)
      shift; [[ $# -lt 2 ]] && { echo "Usage: npvps describe <name> <desc>"; return 1; }
      _npvps_validate_name "$1" || return 1
      ssh "$_npvps_HOST" "bash ~/.vps/session.sh describe '$1' '$2'"; return ;;
    sync)
      ssh "$_npvps_HOST" "bash ~/.vps/session.sh reconcile"
      echo "Registry synced."; return ;;
  esac
  local name="$1"; shift
  local desc="${*:-}"
  _npvps_validate_name "$name" || return 1
  if [[ -n "$desc" ]]; then
    ssh -t "$_npvps_HOST" "bash ~/.vps/session.sh start '$name' '$type' '$desc'"
  else
    ssh -t "$_npvps_HOST" "bash ~/.vps/session.sh start '$name' '$type'"
  fi
}

npvps()   { _npvps_session shell "$@"; }
npvpscc() { _npvps_session claude "$@"; }
npvpscx() { _npvps_session codex "$@"; }
# END np-dev-box aliases
```

After adding, source the shell config and verify the functions are loaded by running `command -v <prefix>` (e.g., `command -v npvps`).

## Step 4: Test Connection (Blocking Step)

**Pause here.** Print my public key again for convenience, and tell me:

> "Send this public key to the VPS admin so they can add it to the server. Once they confirm it's been added, tell me and I'll test the connection."

Once I confirm, test:

```bash
ssh dev@np-dev-box "echo 'Connection OK'; hostname; whoami; test -f ~/.vps/session.sh && echo 'Session manager: OK' || echo 'Session manager: MISSING (ask admin to run VPS_SETUP.sh)'"
```

If the connection times out or is refused, suggest:
- Verify the IP is correct and the VPS is running
- Check if a firewall or corporate VPN is blocking port 22
- Confirm the admin added the key to `/home/dev/.ssh/authorized_keys`
- If using a passphrase, ensure the key is loaded: `ssh-add -l`

If `session.sh` is reported as MISSING, tell me to ask the admin to run `VPS_SETUP.sh` on the server first.

If everything passes, do a quick session test:

```bash
npvps list
```

## Step 5: Git Identity

Since all developers share the `dev` user, git config must be set **per-repo** to preserve individual attribution.

First, verify the repo exists:

```bash
ssh dev@np-dev-box "test -d ~/nextpay/.git && echo 'Repo OK' || echo 'Repo not found'"
```

If the repo exists, ask me for my **full name** and **email**, then set per-repo config:

```bash
ssh dev@np-dev-box "cd ~/nextpay && git config user.name 'My Full Name' && git config user.email 'my@email.com'"
```

**Important**: Do NOT use `--global` — that would overwrite the git identity for all developers sharing this user. Per-repo config only affects the `~/nextpay` directory.

## Summary

After completing all steps, print a concise summary:

```
✓ SSH key:      ~/.ssh/vps/id_vps_ed25519
✓ SSH config:   Host np-dev-box → 13.250.2.78 (user: dev)
✓ Aliases:      npvps, npvpscc, npvpscx (in ~/.zshrc)
✓ Connection:   Tested OK

Quick reference:
  npvps                     → Quick shell on VPS
  npvps my-session          → Create/join tmux session (pair programming!)
  npvpscc my-session        → Same but launches Claude Code
  npvpscx my-session        → Same but launches Codex
  npvps list                → Show all sessions
  npvps end my-session      → Kill a session
  Ctrl+B, D                 → Detach (session stays alive)

Public key to send to admin:
  <print the public key here>
```

## Cleanup (Optional)

If the developer ever needs to remove this setup:
- Delete SSH key: `rm -rf ~/.ssh/vps/`
- Remove `Host np-dev-box` block from `~/.ssh/config`
- Remove the `# BEGIN np-dev-box aliases` ... `# END np-dev-box aliases` block from shell config
- Remove the host key: `ssh-keygen -R 13.250.2.78`
