# api-server

[![CI](https://github.com/anyway-koeln/api-server/actions/workflows/deploy-to-uberspace.yml/badge.svg)](https://github.com/anyway-koeln/api-server/actions/workflows/deploy-to-uberspace.yml)
[![CodeQL](https://github.com/anyway-koeln/api-server/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/anyway-koeln/api-server/actions/workflows/codeql-analysis.yml)
[![Test](https://github.com/anyway-koeln/api-server/actions/workflows/test.yml/badge.svg)](https://github.com/anyway-koeln/api-server/actions/workflows/test.yml)

## Start the Server
Use `yarn start` to start the server.</br>
You can access the graphql endpoint at `0.0.0.0:4000/graphql`.



## Clone on Uberspace

```
git clone https://thomasrosen:PERSONAL-ACCESS-TOKEN@github.com/anyway-koeln/api-server.git api-server
cd api-server/
git pull
yarn
```

Update origin: `git remote set-url origin https://thomasrosen:PERSONAL-ACCESS-TOKEN@github.com/anyway-koeln/api-server.git`

The following is not need. Just here for reference.
```
git remote add origin https://thomasrosen:PERSONAL-ACCESS-TOKEN@github.com/anyway-koeln/api-server.git
git branch --set-upstream-to=origin/main main
```
