#!/bin/bash
set -e

echo "=== Deploy completo Simple Finance ==="

cd "$(dirname "$0")"

# 1. Docker build & run
echo ">>> Construyendo y levantando contenedor..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
sleep 3

# 2. Test API
echo ">>> Probando API..."
TOKEN=$(curl -s http://localhost:3001/api/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"astefanov","password":"Dr@wssap1234k"}' | \
  node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).token)}catch(e){console.log('FAIL')}})")
if [ "$TOKEN" = "FAIL" ] || [ -z "$TOKEN" ]; then
  echo "ERROR: Login falló"
  exit 1
fi
echo "API OK - Token obtenido"

# 3. Nginx config
echo ">>> Configurando nginx..."
sudo tee /etc/nginx/sites-available/lab.farmuhub.co > /dev/null << 'NGINX'
server {
    listen 80;
    server_name lab.farmuhub.co;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lab.farmuhub.co;

    ssl_certificate /etc/nginx/ssl/lab.farmuhub.co.pem;
    ssl_certificate_key /etc/nginx/ssl/lab.farmuhub.co.key;

    location / {
        proxy_pass http://127.0.0.1:5137;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/lab.farmuhub.co.key \
  -out /etc/nginx/ssl/lab.farmuhub.co.pem \
  -subj '/CN=lab.farmuhub.co' 2>/dev/null

sudo ln -sf /etc/nginx/sites-available/lab.farmuhub.co /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
echo "Nginx OK"

# 4. Route53 DNS (necesita ZONE_ID de farmuhub.co)
echo ""
echo "======================================================"
echo "IMPORTANTE: Crear registro DNS en Route53:"
echo ""
echo "  aws route53 change-resource-record-sets \\"
echo "    --hosted-zone-id ZXXXXXXXXXXXX \\"
echo '    --change-batch '"'"'{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"lab.farmuhub.co","Type":"CNAME","TTL":300,"ResourceRecords":[{"Value":"node3.farmuhub.co"}]}}]}'"'" 
echo ""
echo "Reemplazar ZXXXXXXXXXXXX con el Hosted Zone ID de farmuhub.co"
echo ""
echo "======================================================"

# 5. Certbot
echo ">>> Ejecutar certbot cuando el DNS resuelva:"
echo "  sudo certbot --nginx -d lab.farmuhub.co"
echo ""
echo "=== Deploy completado ==="
