# AWS Deployment Guide - Hospital Management System

## Architecture Overview
```
Internet → EC2 (Node.js Backend) → RDS MySQL (Database)
                    ↕
              S3 (Patient Reports)
                    ↕
              IAM (Access Control)
```

---

## Step 1: Setup AWS IAM

1. Go to **AWS Console → IAM → Users → Create User**
2. Name: `hospital-app-user`
3. Attach policies:
   - `AmazonS3FullAccess`
   - `AmazonRDSFullAccess`
4. Go to **Security Credentials → Create Access Key**
5. Save `Access Key ID` and `Secret Access Key` → put in backend `.env`

---

## Step 2: Create Amazon RDS (MySQL)

1. Go to **AWS Console → RDS → Create Database**
2. Settings:
   - Engine: **MySQL 8.0**
   - Template: **Free Tier**
   - DB Instance: `hospital-db`
   - Master username: `admin`
   - Master password: `YourPassword123`
   - Public access: **Yes** (for initial setup)
3. After creation, copy the **Endpoint URL** → put in `.env` as `DB_HOST`
4. **Security Group**: Add inbound rule → MySQL/Aurora → Port 3306 → Your IP
5. Connect and run schema:
   ```bash
   mysql -h <your-rds-endpoint> -u admin -p hospital_db < schema.sql
   ```

---

## Step 3: Create Amazon S3 Bucket

1. Go to **AWS Console → S3 → Create Bucket**
2. Settings:
   - Bucket name: `hospital-reports-bucket` (must be globally unique)
   - Region: `us-east-1`
   - **Uncheck** "Block all public access" (for signed URLs to work)
3. Go to **Permissions → CORS** and add:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
4. Put bucket name in `.env` as `S3_BUCKET_NAME`

---

## Step 4: Launch Amazon EC2

1. Go to **AWS Console → EC2 → Launch Instance**
2. Settings:
   - AMI: **Amazon Linux 2023**
   - Instance type: **t2.micro** (Free Tier)
   - Key pair: Create new → download `.pem` file
   - Security Group inbound rules:
     - SSH: Port 22 (Your IP)
     - HTTP: Port 80 (Anywhere)
     - Custom TCP: Port 5000 (Anywhere)
     - Custom TCP: Port 3000 (Anywhere)

3. Connect to EC2:
   ```bash
   chmod 400 your-key.pem
   ssh -i your-key.pem ec2-user@<your-ec2-public-ip>
   ```

---

## Step 5: Deploy Backend on EC2

```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Clone or upload your project
git clone <your-repo-url>
# OR use scp to upload:
# scp -i your-key.pem -r ./backend ec2-user@<ec2-ip>:/home/ec2-user/

cd backend

# Create .env file with your actual values
nano .env
# Fill in all values from the .env template

# Install dependencies
npm install

# Install PM2 to keep server running
sudo npm install -g pm2
pm2 start server.js --name hospital-api
pm2 startup
pm2 save
```

---

## Step 6: Deploy Frontend on EC2

```bash
cd frontend
npm install
npm run build

# Install nginx
sudo yum install -y nginx

# Copy build files
sudo cp -r build/* /usr/share/nginx/html/

# Configure nginx to proxy API calls
sudo nano /etc/nginx/conf.d/hospital.conf
```

Add this nginx config:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 7: Update Frontend API URL

In `frontend/src/api.js`, change baseURL for production:
```js
const API = axios.create({ 
  baseURL: 'http://<your-ec2-public-ip>/api' 
});
```

---

## Environment Variables Summary (.env)

| Variable | Where to get |
|----------|-------------|
| `DB_HOST` | RDS → Connectivity → Endpoint |
| `DB_USER` | RDS master username |
| `DB_PASSWORD` | RDS master password |
| `AWS_ACCESS_KEY_ID` | IAM → User → Security Credentials |
| `AWS_SECRET_ACCESS_KEY` | IAM → User → Security Credentials |
| `S3_BUCKET_NAME` | S3 bucket name you created |
| `JWT_SECRET` | Any random string (e.g. `openssl rand -hex 32`) |

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | Admin@123 |
| Doctor | Register via /login | Your password |
| Patient | Register via /login | Your password |

---

## Local Development

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev   # runs on http://localhost:5000

# Terminal 2 - Frontend  
cd frontend
npm install
npm start     # runs on http://localhost:3000
```
