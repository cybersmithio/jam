# Docker Setup for MongoDB

This project uses Docker to run MongoDB in a container for development and testing.

## Prerequisites

- Docker Desktop installed on your machine
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Start MongoDB Container

```bash
docker-compose up -d
```

This will:
- Download the MongoDB 7.0 image (first time only)
- Start MongoDB container on port 27017
- Create persistent volumes for data storage
- Set up admin user with credentials from docker-compose.yml

### 2. Verify MongoDB is Running

```bash
docker-compose ps
```

You should see the `jam-auth-mongodb` container with status "Up".

### 3. Check MongoDB Health

```bash
docker-compose logs mongodb
```

Look for messages indicating MongoDB is ready to accept connections.

### 4. Configure Application

Update your `data/config.json` with the MongoDB connection string:

```json
{
  "database": {
    "uri": "mongodb://admin:changeme123@localhost:27017/jam-auth?authSource=admin"
  }
}
```

**Note:** The credentials are in `docker-compose.yml`:
- Username: `admin`
- Password: `changeme123`
- Database: `jam-auth`

### 5. Start Your Application

```bash
npm start
```

The application will connect to MongoDB running in the container.

## Common Commands

### Stop MongoDB Container

```bash
docker-compose down
```

This stops the container but preserves your data in Docker volumes.

### Stop and Remove All Data

```bash
docker-compose down -v
```

**Warning:** This deletes all data in the MongoDB database!

### View MongoDB Logs

```bash
docker-compose logs -f mongodb
```

Press Ctrl+C to stop following logs.

### Restart MongoDB

```bash
docker-compose restart mongodb
```

### Access MongoDB Shell

```bash
docker exec -it jam-auth-mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin
```

Inside the shell:
```javascript
// Switch to your database
use jam-auth

// Show collections
show collections

// Query users
db.users.find().pretty()

// Count users
db.users.countDocuments()

// Exit
exit
```

## MongoDB Container Details

- **Image:** mongo:7.0
- **Container Name:** jam-auth-mongodb
- **Port:** 27017 (exposed to host)
- **Data Volume:** `mongodb_data` (persistent)
- **Config Volume:** `mongodb_config` (persistent)
- **Network:** jam-auth-network
- **Restart Policy:** unless-stopped (restarts automatically unless manually stopped)

## Changing MongoDB Credentials

If you want to change the default credentials:

1. Stop and remove the container and volumes:
   ```bash
   docker-compose down -v
   ```

2. Edit `docker-compose.yml` and change:
   ```yaml
   MONGO_INITDB_ROOT_USERNAME: your-username
   MONGO_INITDB_ROOT_PASSWORD: your-password
   ```

3. Update `data/config.json` with the new connection string:
   ```json
   "uri": "mongodb://your-username:your-password@localhost:27017/jam-auth?authSource=admin"
   ```

4. Start the container again:
   ```bash
   docker-compose up -d
   ```

## Troubleshooting

### Port 27017 Already in Use

If you have MongoDB installed locally, it might be using port 27017. Either:
- Stop your local MongoDB: `net stop MongoDB` (Windows) or `sudo systemctl stop mongod` (Linux)
- Change the port in docker-compose.yml: `"27018:27017"` and update config.json accordingly

### Container Won't Start

Check logs:
```bash
docker-compose logs mongodb
```

### Cannot Connect from Application

1. Verify container is running: `docker-compose ps`
2. Check connection string in `data/config.json`
3. Verify credentials match docker-compose.yml
4. Check application logs for connection errors

### Reset Everything

```bash
# Stop and remove container and volumes
docker-compose down -v

# Remove the Docker image
docker rmi mongo:7.0

# Start fresh
docker-compose up -d
```

## Data Persistence

Data is stored in Docker volumes that persist even when the container is stopped:
- `mongodb_data` - Database files
- `mongodb_config` - Configuration files

To view volumes:
```bash
docker volume ls | grep mongodb
```

To inspect a volume:
```bash
docker volume inspect jam_mongodb_data
```

## Production Considerations

This Docker setup is for **development only**. For production:
- Use stronger passwords
- Enable authentication properly
- Use encrypted connections
- Set up backups
- Consider using managed MongoDB services (MongoDB Atlas, etc.)
- Use environment variables for sensitive data
- Enable MongoDB security features
