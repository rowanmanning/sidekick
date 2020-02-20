# Docker workflow


## Build the image
```
export DOCKER_BUILDKIT=1
docker build . -t sidekick
```

## Create an UUID variable
Example (using uuidgen):
```
EXPORT uuid=$(uuidgen)
```
If you do not create this, this is set in docker-compose.yml


## Run docker-compose

```bash
docker-compose up -d
```

## Run db migrations
When the services is up and running, run db migrations:

```bash
docker-compose exec sidekick make db-migrate-up
```

## Start using
Then you could start using pa11y sidekick at url localhost:8082


