# CLSSWJZ - Personal Finance Management System

[中文说明](./README_CN.md)

## Overview

CLSSWJZ is a complete personal finance management system consisting of:

- Backend Service (Current Repository)
- Mobile App: [CLSSWJZ-APP](https://github.com/clssw1004/clsswjz-app)；Downloads: [Latest Release（Android/Windows/Linux）](https://github.com/clssw1004/clsswjz-app/releases)

### Features

- Multi-book Management
- Fund Account Management
- Income/Expense Recording
- Category Management
- Merchant Management
- User Collaboration
- Multi-language Support (Simplified Chinese, Traditional Chinese, English)
- Cross-platform Support

## Deployment

### Option 1: Using Pre-built Image

1. Create a docker-compose.yml:
```yaml
version: '3.8'

services:
  api:
    image: clssw1004/clsswjz-server:0.0.1
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - API_PREFIX=api
      - DB_TYPE=sqlite        # or mysql
      - DATA_PATH=/data      # SQLite data path
    volumes:
      - ./data:/data        # Mount SQLite data directory
    restart: unless-stopped

  # Optional: MySQL Database
  db:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=your_password
      - MYSQL_DATABASE=clsswjz
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql_data:
```

2. Start the service:
```bash
docker-compose up -d
```

### Option 2: Build Your Own Image

1. Clone the repository:
```bash
git clone https://github.com/clssw1004/clsswjz-server.git
cd clsswjz-server
```

2. Build the image:
```bash
docker build -t clsswjz-server .
```

3. Create docker-compose.yml (same as above, but change image to your built one)
4. Start the service: `docker-compose up -d`

## Development Guide

### Development Commands
```bash
# Start development server with watch mode
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate API documentation
npm run doc:generate

# Run mock data script
npm run mock:data
```

### Environment Configuration

#### Local Development
Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000                # Server port
API_PREFIX=api          # API prefix
NODE_ENV=development    # Environment: development/production

# Database Configuration (MySQL)
DB_TYPE=mysql          # Database type: mysql/sqlite
DB_HOST=localhost      # Database host
DB_PORT=3306          # Database port
DB_USERNAME=root      # Database username
DB_PASSWORD=password  # Database password
DB_DATABASE=clsswjz   # Database name

# SQLite Configuration
# DB_TYPE=sqlite
# DATA_PATH=/data     # SQLite data directory
```

#### Docker Environment Variables
When using Docker, configure environment variables in:

1. docker-compose.yml:
```yaml
services:
  api:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_TYPE=sqlite
      - DATA_PATH=/data
```

2. Environment file:
```bash
# Create .env file
cp .env.example .env
docker-compose --env-file .env up -d
```

### API Documentation

- [API Documentation](docs/api.md)
- [Entity Documentation](docs/entities.md)
- [Enum Documentation](docs/enums.md)

### Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.