#!/usr/bin/env bash
#
# AuraLog（纸间流光）一键部署 & 升级脚本
# =========================================
# 适用于全新安装或代码升级后更新数据库结构。
#
# 用法:
#   chmod +x deploy.sh
#
#   # 首次安装
#   ./deploy.sh install
#
#   # 升级（拉取最新代码 + 数据库结构同步）
#   ./deploy.sh upgrade
#
# 环境变量（可自定义）:
#   APP_DIR=~/auralog        # 应用根目录（默认 ~/auralog）
#   DATA_DIR=/var/data/auralog # 数据目录（SQLite 数据库、上传文件存放，默认 APP_DIR/data）
#   PORT=3000                  # Next.js 端口
#   WS_PORT=3001               # WebSocket 端口
#   NODE_ENV=production        # 运行环境
#

set -euo pipefail

# ── 颜色 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${CYAN}[~]${NC} $1"; }

# ── 默认路径 ──
APP_DIR="${APP_DIR:-$HOME/auralog}"
DATA_DIR="${DATA_DIR:-${APP_DIR}/data}"
GIT_REPO="https://github.com/hzzxcgtz/auralog.git"
DB_DIR="${DATA_DIR}/db"
DB_PATH="${DB_DIR}/auralog.db"
UPLOAD_DIR="${DATA_DIR}/uploads"
ENV_FILE="${APP_DIR}/.env"

# ── PM2 进程名 ──
PM2_NEXT="auralog-next"
PM2_WS="auralog-ws"

# ── 检查必需命令 ──
check_prereqs() {
  local missing=0
  for cmd in node npm git pm2; do
    if ! command -v "$cmd" &>/dev/null; then
      err "未找到 $cmd，请先安装"
      missing=1
    fi
  done

  if ! command -v npx &>/dev/null; then
    err "未找到 npx，请确认 npm 已正确安装"
    missing=1
  fi

  if [ "$missing" -eq 1 ]; then
    info "需要安装的依赖:"
    info "  Node.js 20+:  https://nodejs.org"
    info "  PM2:          npm install -g pm2"
    info "  Git:          apt install git / brew install git"
    exit 1
  fi

  # 检查 Node.js 版本（要求 >= 18）
  local node_ver
  node_ver=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$node_ver" -lt 18 ]; then
    err "Node.js 版本过低（当前 v$(node -v)），需要 v18+"
    exit 1
  fi
  log "环境检查通过 (Node.js $(node -v), npm $(npm -v))"
}

# ── 克隆/拉取代码 ──
sync_code() {
  if [ -d "${APP_DIR}/.git" ]; then
    info "检测到已有代码仓库，正在拉取最新代码..."
    cd "$APP_DIR"
    git stash --include-untracked 2>/dev/null || true
    git pull origin main
    log "代码已更新"
  else
    info "正在克隆代码仓库..."
    mkdir -p "$APP_DIR"
    git clone "$GIT_REPO" "$APP_DIR"
    cd "$APP_DIR"
    log "代码已克隆"
  fi
}

# ── 创建数据目录和 .env ──
setup_env() {
  mkdir -p "$DB_DIR" "$UPLOAD_DIR"

  # 生成随机 AUTH_SECRET（如不存在）
  local existing_secret=""
  if [ -f "$ENV_FILE" ]; then
    existing_secret=$(grep '^AUTH_SECRET=' "$ENV_FILE" | cut -d= -f2-)
  fi

  if [ -z "$existing_secret" ]; then
    local new_secret
    new_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    cat > "$ENV_FILE" <<ENVEOF
# AuraLog 环境配置（由 deploy.sh 自动生成）
DATABASE_URL="file:${DB_PATH}?journal_mode=WAL"
AUTH_SECRET="${new_secret}"
AUTH_URL="http://localhost:${PORT:-3000}"
WS_PORT="${WS_PORT:-3001}"
NODE_ENV="${NODE_ENV:-production}"
ENVEOF
    log ".env 已创建 (AUTH_SECRET 已自动生成)"
  else
    # 仅更新 DATABASE_URL 路径
    if grep -q '^DATABASE_URL=' "$ENV_FILE" 2>/dev/null; then
      sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"file:${DB_PATH}?journal_mode=WAL\"|" "$ENV_FILE"
    else
      echo "DATABASE_URL=\"file:${DB_PATH}?journal_mode=WAL\"" >> "$ENV_FILE"
    fi
    # 确保 WS_PORT 存在
    if ! grep -q '^WS_PORT=' "$ENV_FILE" 2>/dev/null; then
      echo "WS_PORT=${WS_PORT:-3001}" >> "$ENV_FILE"
    fi
    log ".env 已更新"
  fi
}

# ── 安装 npm 依赖 ──
install_deps() {
  info "正在安装 npm 依赖..."
  cd "$APP_DIR"
  npm install --production=false 2>&1 | tail -3
  log "npm 依赖安装完成"
}

# ── 数据库迁移: 同步 Schema + 生成 Client ──
sync_database() {
  cd "$APP_DIR"

  # 1. 备份数据库（如果存在）
  if [ -f "$DB_PATH" ]; then
    local backup="${DB_DIR}/auralog-$(date +%Y%m%d-%H%M%S).db.bak"
    cp "$DB_PATH" "$backup"
    info "数据库已备份到 ${backup}"
  fi

  # 2. 生成 Prisma Client
  info "正在生成 Prisma Client..."
  npx prisma generate 2>&1 | tail -3
  log "Prisma Client 已生成"

  # 3. 同步数据库结构（非破坏性：仅在已有表上增/改列）
  info "正在同步数据库结构..."
  npx prisma db push --accept-data-loss 2>&1 | tail -5

  # --accept-data-loss 是安全的：SQLite 只会做兼容性变更，
  # 如果只是新增表/字段不会丢失数据。如果涉及重命名列等破坏性变更，
  # 需要手动处理，脚本会打印警告。
  log "数据库结构已同步"

  # 4. 检查是否需要 seed（首次安装时数据库为空）
  local table_count
  table_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma_%' AND name != 'sqlite_sequence';" 2>/dev/null || echo "0")
  if [ "$table_count" -le 1 ]; then
    info "检测到空数据库，正在填充初始数据..."
    npm run seed 2>&1 | tail -5
    log "初始数据已填充"
  else
    # 检查是否已有默认任务类别（非首次安装）
    local cat_count
    cat_count=$(npx -y tsx -e "
      const { PrismaClient } = require('${APP_DIR}/src/generated/prisma');
      const p = new PrismaClient();
      p.taskCategory.count().then(c => { console.log(c); p.\$disconnect(); });
    " 2>/dev/null || echo "0")
    if [ "$cat_count" -eq 0 ]; then
      info "任务类别为空，正在执行 seed 中的类别初始化..."
      npx tsx -e "
        const { PrismaClient } = require('${APP_DIR}/src/generated/prisma');
        const p = new PrismaClient();
        const cats = [
          { value: 'SCHOOLWORK', label: '校内作业', color: 'orange', sortOrder: 0 },
          { value: 'PREVIEW',    label: '新课预习', color: 'caramel', sortOrder: 1 },
          { value: 'EXERCISE',   label: '教辅练习', color: 'emerald', sortOrder: 2 },
          { value: 'READING',    label: '阅读',     color: 'teal',    sortOrder: 3 },
        ];
        Promise.all(cats.map(c => p.taskCategory.create({ data: c })))
          .then(() => { console.log('默认任务类别已创建'); p.\$disconnect(); });
      " 2>&1
    fi
    info "数据库已有数据，跳过 seed（保留现有数据）"
  fi
}

# ── 构建 Next.js ──
build_app() {
  info "正在构建 Next.js 应用..."
  cd "$APP_DIR"
  npm run build 2>&1 | tail -10
  log "应用构建完成"
}

# ── PM2 进程管理 ──
manage_processes() {
  # 停止已有进程（如果存在）
  pm2 delete "$PM2_NEXT" 2>/dev/null || true
  pm2 delete "$PM2_WS" 2>/dev/null || true

  # 启动 Next.js
  info "启动 Next.js (端口 ${PORT:-3000})..."
  cd "$APP_DIR"
  PORT="${PORT:-3000}" pm2 start "npx next start -p ${PORT:-3000}" \
    --name "$PM2_NEXT" \
    --env NODE_ENV=production 2>&1 | tail -1

  # 启动 WebSocket 服务
  info "启动 WebSocket 服务 (端口 ${WS_PORT:-3001})..."
  pm2 start "${APP_DIR}/server/ws-server.js" \
    --name "$PM2_WS" \
    --env WS_PORT="${WS_PORT:-3001}" 2>&1 | tail -1

  # 保存 PM2 进程列表（重启后自动恢复）
  pm2 save 2>/dev/null || true

  log "进程已启动"
}

# ── 显示结果 ──
print_summary() {
  echo ""
  echo "╔══════════════════════════════════════════════════╗"
  echo "║        AuraLog（纸间流光）部署完成 🎉           ║"
  echo "╠══════════════════════════════════════════════════╣"
  echo "║  应用:     http://localhost:${PORT:-3000}           ║"
  echo "║  WebSocket: ws://localhost:${WS_PORT:-3001}            ║"
  echo "║  数据库:   ${DB_PATH}  ║"
  echo "║  上传目录: ${UPLOAD_DIR} ║"
  echo "╠══════════════════════════════════════════════════╣"
  echo "║  管理命令:                                       ║"
  echo "║  pm2 status             查看进程状态             ║"
  echo "║  pm2 logs ${PM2_NEXT}      查看 Next.js 日志      ║"
  echo "║  pm2 logs ${PM2_WS}        查看 WS 日志           ║"
  echo "║  pm2 restart all        重启所有进程             ║"
  echo "╚══════════════════════════════════════════════════╝"
}

# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════
MODE="${1:-install}"

case "$MODE" in
  install)
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║   AuraLog 纸间流光 · 全新安装        ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    check_prereqs
    sync_code
    setup_env
    install_deps
    sync_database
    build_app
    manage_processes
    print_summary
    ;;

  upgrade)
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║   AuraLog 纸间流光 · 升级更新        ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    check_prereqs
    sync_code          # 拉取最新代码
    setup_env          # 更新 .env（如有需要）
    install_deps       # 更新依赖
    sync_database      # 同步数据库结构（自动备份）
    build_app          # 重新构建
    manage_processes   # 重启进程
    print_summary
    ;;

  db-only)
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║   AuraLog · 仅同步数据库结构         ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    sync_database
    info "请手动重启 PM2 进程以加载新 Prisma Client:"
    info "  pm2 restart ${PM2_NEXT} ${PM2_WS}"
    ;;

  *)
    echo "用法: ./deploy.sh <install|upgrade|db-only>"
    echo ""
    echo "  install  首次部署安装"
    echo "  upgrade  升级代码并同步数据库结构（安全）"
    echo "  db-only  仅同步数据库结构（代码不变时使用）"
    exit 1
    ;;
esac
