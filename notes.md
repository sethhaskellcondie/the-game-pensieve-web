# Additional Notes

## Workflows
There are a series of workflows to be noted down, right now I'm doing manual testing but in the future adding in end to end tests through Playwright
- Custom Fields CRUD
- Toys CRUD
- Systems CRUD
- Board Game Boxes CRUD (this includes Board Game CRUD)
- Video Game Boxes CRUD (this includes Video Game CRUD)
- Mass Input Mode (each page with input)
- Mass Edit Mode (each page with a table)
- etc. more

# Commands to deploy to Docker Hub
- $ docker build -t sethcondie/the-game-pensieve-web .
- $ docker tag sethcondie/the-game-pensieve-web sethcondie/the-game-pensieve-web:latest
- $ docker push sethcondie/the-game-pensieve-web:latest

# Commands to build and run project through Docker locally
- $ docker build -t sethcondie/the-game-pensieve-web .
- $ docker run -p 4200:80 sethcondie/the-game-pensieve-web

# Commands to pull and run image from Docker Hub
- $ docker pull sethcondie/the-game-pensieve-web:latest
- $ docker run -p 4200:80 sethcondie/the-game-pensieve-web:latest