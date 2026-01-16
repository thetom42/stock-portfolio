#!/bin/bash
# Post-create setup script for dev container
#
# This script runs after the container is created and sets up:
# - Claude Code CLI (via npm)
# - OpenAI Codex CLI (via npm)
# - Just task runner
# - glab CLI (GitLab)
# - Git configuration
# - CLI authentication (glab if GITLAB_TOKEN set, gh if GITHUB_TOKEN set)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo ""
echo "=========================================="
echo "  Dev Container Setup"
echo "=========================================="
echo ""

# Install Claude Code CLI globally
log_info "Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code
log_info "Claude Code CLI installed"

# Install OpenAI Codex CLI globally
log_info "Installing OpenAI Codex CLI..."
npm install -g @openai/codex
log_info "Codex CLI installed"

# Install Just (command runner)
log_info "Installing Just..."
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin
log_info "Just installed"

# Install glab (GitLab CLI)
log_info "Installing glab..."
curl -fsSL https://gitlab.com/gitlab-org/cli/-/raw/main/scripts/install.sh | sh
log_info "glab installed"

# Set up git configuration
log_info "Configuring git..."
if git config --global user.email &> /dev/null; then
    log_info "  - Git config found"
else
    log_warn "  - Git user not configured. Run:"
    echo "    git config --global user.email 'your@email.com'"
    echo "    git config --global user.name 'Your Name'"
fi

# Set up glab authentication
if [ -n "$GITLAB_TOKEN" ]; then
    log_info "Setting up glab authentication..."
    GITLAB_HOST="${GITLAB_HOST:-gitlab.com}"
    echo "$GITLAB_TOKEN" | glab auth login --hostname "$GITLAB_HOST" --stdin 2>/dev/null || \
        log_warn "glab auth failed - run 'glab auth login' manually"
else
    log_warn "GITLAB_TOKEN not set - glab commands may not work"
fi

# Set up gh authentication
if [ -n "$GITHUB_TOKEN" ]; then
    log_info "Setting up gh authentication..."
    echo "$GITHUB_TOKEN" | gh auth login --with-token 2>/dev/null || \
        log_warn "gh auth failed - run 'gh auth login' manually"
else
    log_warn "GITHUB_TOKEN not set - gh commands may not work"
fi

# Verify installations
echo ""
log_info "Verifying installations..."

command -v just &> /dev/null && log_info "  - Just: $(just --version 2>/dev/null)" || log_warn "  - Just: not found"
command -v claude &> /dev/null && log_info "  - Claude Code: installed" || log_warn "  - Claude Code: not found"
command -v codex &> /dev/null && log_info "  - Codex CLI: installed" || log_warn "  - Codex CLI: not found"
command -v glab &> /dev/null && log_info "  - glab: installed" || log_warn "  - glab: not found"
command -v gh &> /dev/null && log_info "  - gh: installed" || log_warn "  - gh: not found"

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Quick start:"
echo ""
echo "  just           # Show available recipes"
echo "  claude         # Start Claude Code CLI"
echo "  codex          # Start OpenAI Codex CLI"
echo ""
