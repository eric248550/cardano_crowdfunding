# Gov3 - DAO Delegation 

**Cardano** DAO Delegation Dashboard

The Gov3 Dashboard is a powerful portal designed to track delegated governance activities, specifically proposal submissions. It provides actionable insights and data that ensure safety and accountability in the governance process.

Gov3 implements a wallet connector that interacts with the users' wallet, closely emulating the [CIP-30](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0030) standard within the connectors. The data signature follows the [CIP-8](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0008) standard to ensure the user's legitimate

![](https://i.imgur.com/6MD5XHP.jpg)


<h1 align="center">Getting started with Gov3</h1>

### Installation

```
$ npm install
```

### Local Development

```
$ npm run dev
```

This command starts a local development webpack server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `dist` directory and can be served using any static contents hosting service.

### Production

```
$ npm run start
```

This command serve the static content `dist` directory with a nodejs express server.

