# PostgreSQL Setup - Complete Configuration

## Installation Details
- **PostgreSQL Version**: 15.14
- **Installation Date**: 2025-10-12
- **Installation Method**: Homebrew
- **Data Directory**: `/opt/homebrew/var/postgresql@15`

## Service Management

### Start PostgreSQL
```bash
brew services start postgresql@15
```

### Stop PostgreSQL
```bash
brew services stop postgresql@15
```

### Restart PostgreSQL
```bash
brew services restart postgresql@15
```

### Check Service Status
```bash
brew services list | grep postgresql
```

## Database Credentials

### Main Application Database
- **Database Name**: `upsell_app_dev`
- **Username**: `upsell_user`
- **Password**: `UpsellDev2025!`
- **Host**: `localhost`
- **Port**: `5432`

### Default Superuser (for admin tasks)
- **Username**: `adi` (your macOS username)
- **Password**: No password required (peer authentication)
- **Database**: `postgres` (default database)

## Connection Strings

### For Application Configuration (.env file)
```bash
DATABASE_URL=postgresql://upsell_user:UpsellDev2025!@localhost:5432/upsell_app_dev
```

### Alternative Format
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=upsell_app_dev
DB_USER=upsell_user
DB_PASSWORD=UpsellDev2025!
```

## Command Line Access

### Connect to your application database
```bash
psql -h localhost -U upsell_user -d upsell_app_dev
```

### Connect as superuser (for admin tasks)
```bash
psql postgres
```

## User Permissions

The `upsell_user` has been granted:
- All privileges on `upsell_app_dev` database
- CREATEDB privilege (can create new databases)
- Owner of `upsell_app_dev` database

## Common Commands

### Inside psql:
```sql
-- List all databases
\l

-- Connect to your database
\c upsell_app_dev

-- List all tables
\dt

-- List all users/roles
\du

-- Exit psql
\q

-- Show current connection info
\conninfo
```

### Create Additional Databases (if needed)
```bash
psql postgres -c "CREATE DATABASE another_db OWNER upsell_user;"
```

### Create Additional Users (if needed)
```bash
psql postgres -c "CREATE USER another_user WITH PASSWORD 'AnotherPass123!';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE another_db TO another_user;"
```

## PATH Configuration

PostgreSQL binaries have been added to your PATH in `~/.zshrc`:
```bash
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

If psql command is not found, run:
```bash
source ~/.zshrc
```

## Troubleshooting

### If connection is refused:
1. Check if PostgreSQL is running:
   ```bash
   brew services list
   ```

2. If not running, start it:
   ```bash
   brew services start postgresql@15
   ```

### If you need to reset the database:
```bash
# Connect as superuser
psql postgres

# Drop and recreate database
DROP DATABASE upsell_app_dev;
CREATE DATABASE upsell_app_dev OWNER upsell_user;
```

### If you need to reset the user password:
```bash
psql postgres -c "ALTER USER upsell_user WITH PASSWORD 'NewPassword123!';"
```

## Security Notes

- The password `UpsellDev2025!` is for LOCAL DEVELOPMENT ONLY
- Never commit credentials to version control
- Add `.env` to your `.gitignore` file
- For production, use environment variables or secrets management

## Quick Start for Your Application

1. Add this to your `.env` file:
   ```bash
   DATABASE_URL=postgresql://upsell_user:UpsellDev2025!@localhost:5432/upsell_app_dev
   ```

2. Test the connection:
   ```bash
   psql -h localhost -U upsell_user -d upsell_app_dev
   ```

3. Run your database migrations (framework specific)

## Support

If you encounter any issues:
1. Check the service is running: `brew services list`
2. Check PostgreSQL logs: `tail -f /opt/homebrew/var/log/postgresql@15.log`
3. Verify credentials match exactly (case-sensitive)
