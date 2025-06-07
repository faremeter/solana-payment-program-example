nginx Payment Proxy
===================

This demonstrates a very simple method to require payment on existing
services, using `nginx`, with `node-server` acting as a facilitator.
The purpose of this is to show that it's possible to easily retrofit
legacy services, requiring new middleware.

1. Start up `node-server`

```bash
( cd ../node-server && npx tsx ./src ) &
```

2. Start up the `nginx` proxy
```bash
./run &
```

Make queries against `http://localhost:1979`.  You can use a modified
version of `test.ts` to query different URLs hosted by `nginx`.
