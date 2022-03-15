# Nginx常用模块三

## 1、负载平衡模块(ngx_http_upstream_module)

用于定义服务器组，这些服务器组可以被proxy_pass，fastcgi_pass，uwsgi_pass，scgi_pass,memcached_pass，grpc_pass指令引用。

- upstream

```nginx
Syntax: upstream name { ... }
Default: -
Context: http
```

定义服务器组，服务器可以侦听不同的端口，另外，侦听TCP和Unix scoket的服务器可以混用。例如:

```nginx
upstream backend {
	server backendl.example.com weight=5;
	server 127.0.0.1:8080	max_fails=3 fail_timeout=30s;
	server unix:/tmp/backend3;
	server backupl.example.com backup;
}
```

默认情况下，使用加权轮询平衡算法分配请求，上面的例子中，如果有7个请求，则backend1.example.com服务器会分配5个，第二个和第三个服务器各分配一个；如果在与服务器通信期间发生错误，则请求将传递到下一个服务器，依此类推，直到尝试所有运行中的服务器为止。如果无法从任何服务器获得成功的响应，客户端将得到backup1.example.com的响应。

- server

```nginx
Syntax: server address [parameters]; 
Default: -
Context: upstream
```

定义服务器地址和其它参数,地址可以是IP地址或者域名加可选端口，也可以是使用"unix' 开头的UNIX socket路径,端口如果没有指定，默认为80。一个可以解析为多个地址的域名一次性定义了多个服务器。

能定义的参数有：

1. weight=number : 设置权重，默认是1
2. max_conns=number : 限制与代理服务器同时进行活动连接的最大数目,默认为0,意思是不限制
3. max_fails=number : 失败尝试最大次数；超出此处指定的次数时 server将被标记为不可用，默认为1
4. fail_timeout=time : 后端服务器标记为不可用状态的连接超时时长，默认10s
5. backup : 标记这个服务器为备份服务器
6. down : 将服务器标记为永久不可用。配合ip_hash使用，实现灰度发布。



- ip_hash

```nginx
Syntax: ip_hash;
Default: -
Context: upstream
```

使用ip_hash的负载平衡方式。该方法确保来自同一客户端的请求总是传递到同一服务器，除非该服务器不可用。在后一种情况下，客户机请求将传递到另一个服务器。 如果其中一个服务器需要临时删除，则应使用down参数对其进行标记，以保留客户端IP地址的当前哈希。

例如:

```nginx
upstream backend {
	ip_hash;
    
	server backend1.example.com;
	server backend2.example.com;
	server backend3.example.com down;
	server backend4.examp1e.com;
}
```

- least_conn

```nginx
Syntax: least_conn;
Default: -
Context: upstream
```

最少活跃连接调度算法，同时也要考虑权重，如果连接数相同，则使用加权轮询平衡算法。

- least_time  （least  [liːst] 最少的）

```nginx
Syntax: least_time header | last_byte [inflight];
Default: -
Context: upstream
This di rective appeared in version 1.7.10.
```

以最小的平均响应时间和最少的活动连接数做为负载平衡算法。同时考虑服务器的权重。如果有多个这样的服务器，则使用加权循环平衡方法。商业版本才支持这个指令。

- hash

```nginx
Syntax: hash key [consistent] ;
Default: -
Context: upstream
This di rective appeared in version 1.7.2.
```

基于指定的key的hash算法来建立client-server映射表实现对请求的调度，此处的key可以是文本，变量或二者组合。

作用：将请求分类,同-类请求将发往同一个upstream server，使用consistent参数，将使用ketama一致性hash算法， 适用于后端是Cache服务器 (如varnish) 时使用。

```nginx
hash $request_uri consistent;
hash $remote_addr;
```

- keepalive

```nginx
Syntax: keepalive connections;
Default: -
Context: upstream
This di rective appeared in version 1.1.4.
```

为到上游服务器的连接激活缓存。connections参数为同上游服务器的空闲保持连接的最大数量。
connections参数应该设置为足够小的数字，以便上游服务器可以处理新的传入连接。
带keepalive的memcached上游配置示例:

```nginx
upstream memcached_backend {
	server 127.0.0.1:11211;
	server 10.0.0.2:11211;
    
	keepalive 32;
}
server {
    ...
	location /memcached/ {
		set $memcached_key $uri;
		memcached_pass memcached_backend;
	}
}

```

对于HTTP , proxy_http_version指令应该设置到1.1,并且"Connection"头区域应该被清空。

```nginx
upstream http_backend {
	server 127.0.0.1:8080;
	keepalive 16;
}
server {
    ...
        
	location /http/ {
		proxy_pass http://http_backend;
		proxy_http_version 1.1; 
		proxy_set_header Connection "";
        ...
	}
}
```

对于FastCGI服务器，fastcgi_keep_conn应该被设置on。

```nginx
upstream fastcgi_backend {
	server 127.0.0.1:9000;
	keepalive 8;
}

server {
    ...
        
	location /fastcgi/ {
		fastcgi_pass fastcgi_backend;
		fastcgi_keep_conn on; 
	}
}

```

注：负载平衡方法应该在keepalive指令前面配置; SCGI和uwsgi协议没有保持连接的概念。

- health_check (nginx plus支持的健康检查机制)
- nginx_upstream_check_module (淘宝开发的第三方健康检查模块)

下载地址: https://www.keepalived.org/download.html

配置案例：

```nginx
upstream backend {
	server backend1.example.com	weight=5;
	server backend2.example.com:8080;
	server unix:/tmp/backend3;
    
	server backup1.example.com:8080	backup;
	server backup2.example.com:8080 backup;
}
server {
	location / {
		proxy_pass http://backend;
	}
}
```

## 2. 重定向模块（ngx_ http_ rewrite_ module）

这个模块使用PCRE正则表达式更改请求的URI，返回重定向指令并有条件的选择配置。

break，if，return，rewrite，set指令执行顺序如下:

- 这个模块的指令在server级别是顺序执行

- 重复
  。基于请求的URI查找对应的一个location
  。在找到的location中，模块指令按顺序执行
  。如果请求的URl被重写，则循环重复,但不超过10次

  

- break

```nginx
Syntax: break;
Default: -
context: server, location, if
```

停止处理当前的ngx-http-rewrite-module指令集。如果该指令是在location中，那么在这个location中，对请求的进一步处理将继续进行。

```nginx
if ($slow) {
	1imit_rate 10k;
	break;
}
```

- if

```nginx
Syntax: if (condition) { ... }
Default: -
context: server, location
```

若条件判断为真，则执行花括号内的指令，并且将括号内的配置应用到请求上。if指令中的配置是从上一层配置中继承的。

条件判断式的有如”下种类:

- 一个变量名。如果值为空或者0，则为flase
- 比较字符串变量使用"="和"!=”
- 测试一个变量是否与一个正则表达式匹配，正则表达式前使用"~"(区分大小写)或"~* "(不区分大小写)操作符，正则表达式能使用"$1到$9"变量，以便后面可以重复使用；不匹配，使用"!~"和"!~*"操作符，如果正则表达式中含有"}"或";"符号，应使用单引号或双引号将正则表达式括起来。
- 测试一个文件是否存在使用"-f"和"!-f"
- 测试一个目录是否存在使用"-d"和"!-d"
- 测试一个文件、目录、或符号链接文件是否存在，使用"-e"和"!-e"
- 测试一个文件是否可执行使用"-x"和"!-x"

例如：

```nginx
if ($http_user_agent ~ MSIE) {
	rewrite ^(.*)$ /msie/$1 break;
}

if ($http_cookie ~* "id=([^;]+)(?:;|$)") {
	set $id $1;
}

if ($request_method = POST) {
	return 405; 
}

if ($slow) {
	1imit_rate 10k;
}

if ($invalid_referer) {
	return 403 ;
}
```

$invalid_referer是一个内建变量，由valid_referers指令进行设置

- return

```nginx
Syntax:	 return code [text];
		return code URL;
		return URL;
Default: -
Context: server, location, if
```

停止处理，返回状态码code给客户端。返回非标准码444将关闭该连接,而且不发送响应header。

- rewrite  （replacement [rɪˈpleɪsmənt]  替换）

```nginx
Syntax: rewrite regex replacement [flag] ;
Default: -
Context: server, location, if
```

如果regex匹配了一个请求的URI， 该URI被替换为replacement。rewrite 指令在配置文件中按照出现的顺序执行。可使用flag中止进一步的处理。如果replacement以"http://","https://"为起始的字符串，将中止处理，并返回重定向指令给客户端。
flag参数的值可以为:

last停止当前ngx_http_rewrite_module模块指令集的处理，并为修改后的URl寻找新的匹配的location
break停止当前ngx_http_rewrite_module模块指令集的处理，与break指令作用相同
redirect 返回302代码的临时重定向，当replacement不以"http://","https://"为起始的字符串时使用
permanent 返回301代码的永久重定向

例子：

```nginx
if ($http_user_agent ~ MSIE) {
	rewrite ^(.*)$ /msie/$1 break; 
}

if ($http_cookie ~* "id=([^;]+)(?:;|$)") {
	set $id $1;
}

if ($request_method = POST) {
	return 405;
}

if ($slow) {
	1imit_rate 10k;
}

if ($invalid_referer) {
return 403; 
}
```

$invalid_referer是一个内建变量，由valid_referers指令进行设置

- return

```nginx
Syntax:	 return code [text] ;
		return code URL;
		return URL;
Default: -
Context: server, location, if
```

停止处理，返回状态码code给客户端。返回非标准码444将关闭该连接，而且不发送响应header。

- rewrite

```nginx
Syntax: rewrite regex replacement [flag];
Default: -
Context: server, location, if
```

如果regex匹配了一个请求的URI，该URI被替换为replacement。rewrite 指令在配置文件中按照出现的顺序执行。可使用flag中止进一步的处理。如果replacement以"http://","https/”为起始的字符串,将中止处理,并返回重定向指令给客户端。

flag参数的值可以为:

- last停止当前ngx_http_rewrite_module模块指令集的处理，并为修改后的URI寻找新的匹配的location
- break停止当前ngx_http_rewrite_module模块指令集的处理，与break指令作用相同
- redirect返回302代码的临时重定向,当replacement不以htp://*,"https://"为起始的字符串时使用
- permanent返回301代码的永久重定向

例子：

```nginx
server {
    ...
	rewrite ^(/download/. *)/media/(.*)\..*$ $1/mp3/$2.mp3 last;
	rewrite ^(/download/. *)/audio/(.*)\..*$ $1/mp3/$2.ra last;
	return 403;
    ...
}
```

但如果这些指令被放入"/download/" location区块中，应将last flag替换为break，否则nginx会不断循环，达到10次后，返回500 error

```nginx
location /download/ {
	rewrite ^(/download/.*)/media/(.*)\..*$ $l/mp3/$2.mp3 break;
	rewrite ^(/download/.*)/audio/(.*)\..*$ $l/mp3/$2.ra break;
	return 403;
}
```

如果replacement包含请求参数，原来的请求参数将被追加在后面。如果不希望追加原来的请求参数，可在replacement字符串的末尾添加一个"?”符号，例如:

```nginx
rewrite ^/users/(.*)$ /show?user=$l? last;
```

- rewrite_log

```nginx
Syntax: rewrite_log on | off;
Default: rewrite_log off;
context: http, server, location, if
```

是否开启ngx_http_rewrite_module模块的日志，如果开启，该模块的日志将被记录进入error_log中，日志的级别为notice （ [ˈnoʊtɪs]  通知）

- set

```nginx
Syntax: set $variable value;
Default: -
Context: server, location, if
```

为变量赋值。value可包含：文本，变量，或文本和变量的组合

## 3.引用模块（ngx_http_referer_module）

用于阻止"referer”头字段中具有无效值的请求访问站点。

- valid_refers

```nginx
Syntax: valid_referers none | blocked | server_names | string ...;
Default: -
Context: server, location
```

定义referer首部的合法可用值，不能匹配的将是非法值。指定"referer”请求头字段值，该值将导致内置变量$invalid_ referer为空字符串。否则，变量值为"1"。搜索匹配项不区分大小写。参数如下:

- none: 请求报文首部没有referer首部
- blocked: "referer “字段存在于请求头中，但其值已被防火墙或代理服务器删除；这些值是不以"http://"或"https://"开头的字符串;
- server_names: "referer"请求头字段包含一个服务器名称；
- arbitrary string: 任意字符串，定义服务器名称和一个可选的URl前缀，开头和结尾可以使用 "* "；检查时，忽略"referer”字段的服务器端口。（arbitrary [ˈɑːrbɪtreri]  任意的）
- regular expression: 正则表达式匹配到的字符串。第一个符号应该是"~"。 应该注意,表达式将与"http://"或"https://"之 后开始的文本匹配。（regular  [ˈreɡjələr] 有规律的 expression [ɪkˈspreʃn]）

配置举例：

```nginx
valid_referers none blocked server_names
			*.example.com example.* www.example.org/galleries/
			~\.goog1e\.;
if ($invalid_referer) {
	return 403;
}
```

## 4. ngx_ stream_core_ module模块

基于tcp或udp的服务连接的反向代理，即工作于传输层的反向代理或调度器。此模块从1.9.0版开始可用。这个模块在默认情况下不会构建，应该使用--with-stream配置参数来启用它。

- listen

设置服务器接收的地址和端口组合，也可以只设置端口

```nginx
Syntax: listen address:port [ssl] [udp] [proxy_protoco1] [backlog=number][rcvbuf=size] [sndbuf=size] [bind]
		[ipv6only=on | off] [reuseport] [so_ keepalive=on|off| [keepid1e]: 
[keepintvl]:[keepcnt]];
Default: -
Context: server
```

- 例如：

```nginx
listen 127.0.0.1:12345;
1isten *:12345;
listen 12345;	# same as *:12345
listen localhost:12345;

listen [::1] :12345;
listen [::]:12345;

listen unix:/var/run/nginx.sock;

listen 127.0.0.1:12345-12399;
listen 12345-12399;
```

配置案例：

```nginx
worker_processes auto;
error_log /var/1og/nginx/error.log info;

events {
	worker_connections 1024;
}

stream {
	upstream backend {
		hash $remote_addr consistent;
        
		server backendl.example.com:12345 weight=5;
		server 127.0.0.1:12345		max_fails=3 fails_timeout=30s;
		server unix:/tmp/backend3;
    }

    upstream dns {
            server 192.168.0.1:53535;
            server dns.example.com:53;
    }

    server {

            listen 12345;
            proxy_connect_timeout 1s;
            proxy_timeout 3s;
            proxy_pass backend;
    }

    # reuseport 重用端口 同一个端口可以有多个socket同时进行监听
    
    server {
            listen 127.0.0.1:53 udp reuseport;
            proxy_timeout 20s;
            proxy_pass dns;
    }

    server {
            listen [::1]:12345;
            proxy_pass unix:/tmp/stream.socket;
        }
}
```

## 5. ngx_stream_proxy_module模块

 允许代理TCP/UDP和UNIX socket数据流

- proxy_pass

```nginx
Syntax: proxy_pass address;
Default: -
Context: server
```

设置被代理服务器的地址。可以是域名或IP地址和一个端口，或者UNIX socket路径

```nginx
proxy-pass localhost:12345;
proxy_pass unix:/tmp/stream.socket;
```

- proxy_timeout

```nginx
Syntax: proxy_timeout timeout;
Default: proxy_timeout 10m;
Context: stream, server
```

设置客户端或代理服务器连接上两个连续读或写操作之间的超时时间。如果在这段时间内没有数据传输，则连接将关闭。

- proxy_connect_timeout

```nginx
Syntax:
proxy_connect_timeout time;
Default: proxy_connect_timeout 60s;
Context: stream, server
```

定义与被代理服务器建立连接的超时时间

- proxy_bind

```nginx
Syntax: proxy_bind address [transparent] | off;
Default: -
context: stream, server
This di rective appeared in version 1.9.2.
```

指定到被代理服务器数据包的源IP地址。参数可以包含变量，off表示取消从上一级的继承配置，以便让系统自动分配本地的地址。

transparent（[trænsˈpærənt]透明的）启用透明代理

透明代理的意思是客户端根本不需要知道有代理服务器的存在。既然透明代理是感知不了代理的存在，那么非透明代理就是可以感知到代理的存在了，最简单的方式就是你要去访问网站A，在正常情况下，网站A看到访问是来自于你的终端的（比如源IP地址是你自己浏览器的），假如你的终端是通过代理来访问网站A的，在普通非透明代理情况下，网站A看到请求是来自于你的代理IP而看不到你这个终端，在透明代理情况下，网站A感知不到你和它之间中间有一层代理，网站A看到的请求是来自于你的终端地址。


```nginx
proxy_bind $remote_addr transparent;
```

配置案例

```nginx
server {
	listen 127.0.0.1:12345;
	proxy_pass 127.0.0.1:8080; 
}

server {
	listen 12345; 
	proxy_connect_timeout 1s;
	proxy_timeout 1m;
	proxy_pass example.com:12345 ;
}

server {
	listen 53 udp reuseport;
	proxy_timeout 20s;
	proxy_pass dns.xample.com:53;
}

server {
	listen [::1]:12345;
	proxy_pass unix:/tmp/stream.socket;
}
```

**附录：PCRE正则表达式语法**

| 字符        | 描述                                                         |
| ----------- | ------------------------------------------------------------ |
| \           | 将下一个字符标记为一个特殊字符，或一个原义字符，或一个向后引用，或一个八进制转义符。例如，”\n”匹配一个换行符。 |
| ^           | 匹配输入字符串的开始位置。                                   |
| $           | 匹配输入字符串的结束位置。                                   |
| *           | 匹配前面的子表达式零次或多次，等价于{0,}                     |
| +           | 匹配前面的子表达式一次或多次，等价于{1,}                     |
| ?           | 匹配前面的子表达式零次或一次，等价于{0,1}                    |
| ?           | 当该字符紧跟在任何一个其他限制符(*,+,?,{n},{n,},{n,m})后面时，匹配模式是非贪婪的。非贪婪模式尽可能少地匹配所搜索的字符串，而默认的贪婪模式则尽可能多地匹配所搜索的字符串。例如，对于字符串”oooo”,”o+?”将匹配单个”o”,而”o+”将匹配所有的”o”。 |
| {n}         | N是一个非负整数，匹配确定的n次。                             |
| {n,}        | N是一个非负整数，至少匹配n次。                               |
| {n,m}       | M和n均为非负整数，其中n<=m，最少匹配n次且最多匹配m次。       |
| .           | 匹配除”\n”之外的任何单个字符。要匹配包括”\n”在内的任何字符，请使用像”[.\n]”的模式 |
| (pattern)   | 匹配pattern并获取这一匹配。                                  |
| (?:pattern) | 匹配pattern但不获取匹配结果。这在使用“或”字符(\|)来组合一个模式的各个部分是很有用的。例如:’industry\|industries’就可以用’industr(?:y\|ies)’代替 |
| (?=pattern) | 正向预查，在任何匹配pattern的字符串开始处匹配查找字符串。例如：”Windows(?=95\|98\|NT\|2000)”能匹配”Windows2000”中的”Windows”，但不能匹配”Windows3.1”中的”Windows”。 |
| (?!pattern) | 负向预查，在任何不匹配pattern的字符串开始处匹配查找字符串。例如：”Windows(?!95\|98\|NT\|2000)”能匹配”Windows3.1”中的”Windows”，但不能匹配”Windows2000”中的”Windows”。 |
| x\|y        | 匹配x或y。                                                   |
| [xyz]       | 字符集合，匹配所包含的任何一个字符。                         |
| [^xyz]      | 负值字符集合，匹配未包含的任意字符。                         |
| [a-z]       | 字符范围，匹配指定范围内的任意字符。                         |
| [^a-z]      | 负值字符范围，匹配任何不在指定范围内的任意字符。             |
| \b          | 匹配一个单词边界，也就是单词和空格间的位置。                 |
| \B          | 匹配非单词边界。                                             |
| \cx         | 匹配由x指明的控制字符。X的值必须为A-Z或a-z之间               |
| \d          | 匹配一个数字字符。等价于[0-9]                                |
| \D          | 匹配一个非数字字符。等价于[^0-9]                             |
| \f          | 匹配一个换页符。等价于\x0c和\cL                              |
| \n          | 匹配一个换行符。等价于\x0a和\cJ                              |
| \r          | 匹配一个回车符。等价于\x0d和\cM                              |
| \s          | 匹配任何空白字符，包括空格、制表符、换页符等。               |
| \S          | 匹配任何非空白符。                                           |
| \t          | 匹配一个制表符                                               |
| \w          | 匹配包括下划线的任何单词字符。等价于[a-zA-Z0-9_]             |
| \W          | 匹配任何非单词字符。                                         |
| \xn         | 匹配n，其中n为十六进制转义值。例如”\x41”匹配”A”。            |
| \num        | 匹配num，其中num是一个正整数。对所获取的匹配的引用。例如：”(.)\1” |