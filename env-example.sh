# ===============================
# APLICAÇÃO
# ===============================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="CMV Control"
NEXT_PUBLIC_APP_DESCRIPTION="Sistema inteligente para controle de CMV"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# ===============================
# SUPABASE - OBRIGATÓRIO
# ===============================
# URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

# Chave pública (anon key) do Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Chave de serviço do Supabase (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret do Supabase (para validação de tokens)
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# ===============================
# BANCO DE DADOS
# ===============================
# URL de conexão direta com PostgreSQL (opcional)
DATABASE_URL=postgresql://user:password@host:port/database

# ===============================
# CACHE E SESSION
# ===============================
# Redis para cache (opcional - via Upstash)
UPSTASH_REDIS_REST_URL=your_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token

# Chave secreta para sessões
NEXTAUTH_SECRET=your_nextauth_secret

# ===============================
# STORAGE E UPLOAD
# ===============================
# Configurações do Supabase Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=your_supabase_storage_url

# Limite de upload de arquivos (em MB)
NEXT_PUBLIC_MAX_FILE_SIZE=10

# ===============================
# EMAIL E NOTIFICAÇÕES
# ===============================
# SMTP para emails (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Email remetente
FROM_EMAIL=noreply@cmvcontrol.app

# ===============================
# MONITORAMENTO E ANALYTICS
# ===============================
# Sentry para monitoramento de erros (opcional)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_public_sentry_dsn

# Google Analytics (opcional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# Vercel Analytics (opcional)
NEXT_PUBLIC_VERCEL_ANALYTICS=true

# ===============================
# APIS EXTERNAS
# ===============================
# API para OCR de notas fiscais (opcional)
OCR_API_KEY=your_ocr_api_key
OCR_API_URL=your_ocr_api_url

# API para preços de mercado (opcional)
MARKET_PRICES_API_KEY=your_market_api_key

# ===============================
# DESENVOLVIMENTO
# ===============================
# Ambiente de execução
NODE_ENV=development

# Debug do Next.js
DEBUG=false

# Logs detalhados
NEXT_PUBLIC_DEBUG_MODE=false

# Bypass de autenticação em desenvolvimento (CUIDADO!)
BYPASS_AUTH=false

# ===============================
# PRODUÇÃO
# ===============================
# Domínio de produção
NEXT_PUBLIC_PRODUCTION_URL=https://cmvcontrol.app

# Webhook de deploy (opcional)
DEPLOY_WEBHOOK_URL=your_deploy_webhook

# ===============================
# PWA
# ===============================
# Desabilitar PWA em desenvolvimento
DISABLE_PWA=true

# ===============================
# BACKUP
# ===============================
# Configurações de backup automático (opcional)
BACKUP_FREQUENCY=weekly
BACKUP_RETENTION_DAYS=30

# Google Drive para backup (opcional)
GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret

# ===============================
# RATE LIMITING
# ===============================
# Configurações de rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# ===============================
# FEATURES FLAGS
# ===============================
# Habilitar/desabilitar funcionalidades
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_EXPORT=true
NEXT_PUBLIC_ENABLE_OCR=false

# ===============================
# REGIONAIS E LOCALIZAÇÃO
# ===============================
# Configurações regionais padrão
NEXT_PUBLIC_DEFAULT_LOCALE=pt-BR
NEXT_PUBLIC_DEFAULT_TIMEZONE=America/Sao_Paulo
NEXT_PUBLIC_DEFAULT_CURRENCY=BRL

# ===============================
# LOGS
# ===============================
# Nível de log
LOG_LEVEL=info

# Arquivo de log (opcional)
LOG_FILE=./logs/app.log

# ===============================
# EXEMPLO DE CONFIGURAÇÃO COMPLETA
# ===============================
# Para começar rapidamente, você precisa apenas de:
# 1. NEXT_PUBLIC_SUPABASE_URL
# 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
# 3. SUPABASE_SERVICE_ROLE_KEY
#
# As outras variáveis são opcionais e podem ser 
# configuradas conforme necessário.

# ===============================
# INSTRUÇÕES
# ===============================
# 1. Copie este arquivo para .env.local
# 2. Preencha as variáveis obrigatórias do Supabase
# 3. Configure outras variáveis conforme necessário
# 4. Nunca commite arquivos .env com dados reais!