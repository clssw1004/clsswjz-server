# CLSSWJZ - Personal Finance Management System

[中文说明](./README_CN.md)

## Projects
- Backend Service (Current)
- Mobile App: [CLSSWJZ-APP](https://github.com/clssw1004/clsswjz-app.git) (Flutter)

### Introduction

CLSSWJZ is a comprehensive personal finance management system that includes both backend services and mobile applications. It helps users manage their finances through features like multi-account books, fund accounts, and collaborative bookkeeping.

### Features

- Multi-account book management
- Fund account management
- Income/Expense recording
- Category management
- Merchant management
- User collaboration
- Multi-language support (zh-CN, zh-TW, en)
- Multi-platform support

### Tech Stack

- Backend: NestJS + TypeORM
- Database: MySQL/SQLite
- Authentication: JWT
- API Documentation: Markdown
- Mobile App: Flutter

### Development

#### Prerequisites

- Node.js >= 18
- MySQL/SQLite
- npm/yarn

#### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/clsswjz-server.git

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file with your database settings

# Start development server
npm run start:dev
```

#### Development Commands
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

#### Docker Deployment

```bash
# Build image
npm run docker:build

# Run with docker-compose
npm run docker:compose
```

### Documentation

- [API Documentation](docs/api.md)
- [Entity Documentation](docs/entities.md)

### Environment Configuration

#### Local Development
Create a `.env` file in the root directory and configure the following variables:

```bash
# Server Configuration
PORT=3000                 # Server port
API_PREFIX=api           # API prefix
NODE_ENV=development     # Environment: development/production

# Database Configuration (MySQL)
DB_TYPE=mysql           # Database type: mysql/sqlite
DB_HOST=localhost       # Database host
DB_PORT=3306           # Database port
DB_USERNAME=root       # Database username
DB_PASSWORD=password   # Database password
DB_DATABASE=clsswjz    # Database name

# Database Configuration (SQLite)
# DB_TYPE=sqlite
# DB_DATABASE=db.sqlite
```

#### Docker Deployment
When using Docker, you can configure environment variables in the following ways:

1. Using docker-compose.yml:
```yaml
services:
  api:
    environment:
      - PORT=3000
      - API_PREFIX=api
      - NODE_ENV=production
      - DB_TYPE=mysql
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USERNAME=root
      - DB_PASSWORD=your_password
      - DB_DATABASE=clsswjz
```

2. Using environment file:
```bash
# Create .env file
cp .env.example .env

# Start with docker-compose
docker-compose --env-file .env up -d
```

3. Using command line:
```bash
docker run -d \
  -e PORT=3000 \
  -e DB_TYPE=mysql \
  -e DB_HOST=db \
  -e DB_PORT=3306 \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=your_password \
  -e DB_DATABASE=clsswjz \
  clsswjz-server
```

#### Database Selection
1. MySQL Configuration:
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=clsswjz
```

2. SQLite Configuration:
```env
DB_TYPE=sqlite
DB_DATABASE=db.sqlite
```