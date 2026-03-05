# dev-vps

Shared VPS setup for pair programming via tmux. Two files:

## Files

### `VPS_SETUP.sh`

**Run once on the server** (requires `sudo`). Sets up:

- A shared `dev` user that all developers SSH into
- Bun, Volta, Node.js, Claude Code, Codex CLI
- GitHub CLI + authentication
- Clones the project repo to `~/nextpay`
- tmux-based session manager for persistent, shareable sessions

```bash
# On the VPS (as any sudoer):
sudo bash VPS_SETUP.sh
```

Imports SSH public keys from all existing users on the system into the shared `dev` user's `authorized_keys`.

### `client-prompt.md`

**For each developer.** Paste the contents into a coding agent (Claude Code, Codex, etc.) and it walks you through:

1. Generating an SSH key
2. Configuring SSH (`~/.ssh/config`)
3. Setting up shell aliases (`npvps`, `npvpscc`, `npvpscx`)
4. Testing the connection
5. Setting per-repo git identity

## How Pair Programming Works

All developers SSH as the shared `dev` user. The tmux session manager lets multiple people attach to the same named session:

```bash
# Developer A:
npvpscx feature-auth       # Creates a Codex session called "feature-auth"

# Developer B:
npvpscx feature-auth       # Joins the SAME terminal — live pair programming
```

Detach without killing the session: `Ctrl+B, D`

## Adding a New Developer

1. Get their SSH public key (they generate it via `client-prompt.md`)
2. On the VPS: `echo 'ssh-ed25519 AAAA...' >> /home/dev/.ssh/authorized_keys`
3. They finish the client-prompt setup and connect

## Session Commands

| Command | Description |
|---|---|
| `npvps` | Quick shell (no session) |
| `npvps my-session` | Create/attach to named session |
| `npvpscc my-session` | Session with Claude Code |
| `npvpscx my-session` | Session with Codex |
| `npvps list` | List all sessions |
| `npvps end my-session` | End a session |
| `npvps --help` | Full usage |
