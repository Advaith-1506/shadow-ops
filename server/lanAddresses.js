import os from 'node:os';
export function getLanAddresses(interfaces=os.networkInterfaces()) {
  return Object.entries(interfaces).flatMap(([name,nets])=>(nets || []).filter(n=>n.family==='IPv4'&&!n.internal).map(n=>({name,address:n.address})))
    .sort((a,b)=>score(b)-score(a));
}
function score(n) {return (/^(en|eth|wlan|wi-fi)/i.test(n.name)?10:0)+(/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address)?5:0)-(/utun|tun|tailscale|docker/i.test(n.name)?10:0);}
