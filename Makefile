solo-up:
	docker compose -f packages/contracts/docker-compose.yaml up -d
solo-down:
	docker compose -f packages/contracts/docker-compose.yaml down
