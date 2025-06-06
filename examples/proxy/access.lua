local httpc = require("resty.http").new()

ngx.log(ngx.STDERR, ngx.headers);

local req_headers = ngx.req.get_headers();

local res, err = httpc:request_uri("http://127.0.0.1:3000/protected", {
    headers = req_headers
})

if not res then
    ngx.log(ngx.ERR, "request failed: ", err)
    return
end

if res.status == 200 then
   return
end

ngx.status = res.status;
ngx.say(res.body);
