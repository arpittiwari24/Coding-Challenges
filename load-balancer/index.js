const { default: cluster } = require("cluster");
const { log } = require("console");
const http = require("http");
const numCpus = require("os").cpus.length
log(numCpus)
const hostname = "127.0.0.1"
const allServers = [
  {
    id: 1,
    port: 8080,
    healthy:true,
  },
  {
    id:2,
    port: 8081,
    healthy:true,
  },
  {
    id:3,
    port: 8082,
    healthy:true,
  },
  {
    id:4,
    port: 8083,
    healthy:true,
  },
]


allServers.forEach(server => {
  const instance = http.createServer((req,res) => {
     res.statusCode = 200;
    const incoming_url = req.url;
  if(incoming_url === "/") {
 const host = req.headers.host;
    const user_agent = req.headers["user-agent"];
    res.setHeader("Content-Type", "text/plain");
    res.end(`Request coming from ${incoming_url} on host: ${host} on user-agent: ${user_agent} on server: ${server.id} and method is ${req.method}`);
    } else if(incoming_url === "/new") {
 const host = req.headers.host;
    const user_agent = req.headers["user-agent"];
    res.setHeader("Content-Type", "text/plain");
    res.end(`Request coming from ${incoming_url} on New Url !!`);
    } 
  })

  instance.listen(server.port,hostname,()=> {
    log(`listening on port : ${server.port} !!`)
  })
})

let currentServerIndex = 0 

const requestHandler = (req, res) => {
  const currentServer = allServers[currentServerIndex];
  currentServerIndex = (currentServerIndex + 1) % allServers.length;

  // Find the next healthy server
  let nextServerIndex = currentServerIndex;
  let nextServer = allServers[nextServerIndex];
  while (!nextServer.healthy && nextServerIndex !== currentServerIndex) {
    nextServerIndex = (nextServerIndex + 1) % allServers.length;
    nextServer = allServers[nextServerIndex];
  }

  // If all servers are unhealthy, respond with an error
  if (!nextServer.healthy) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("No healthy servers available");
    return;
  }

  const requestOptions = {
    port: currentServer.port,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyRequest = http.request(requestOptions, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyRequest, { end: true });
};

const mainServer = http.createServer(requestHandler);
const mainPort = 8000;

mainServer.listen(mainPort, () => {
  log(`Main server started on port ${mainPort}`);
});
