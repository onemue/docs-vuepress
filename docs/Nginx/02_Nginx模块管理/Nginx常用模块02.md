# Nginx常用模块二

## 1、日志记录模块（ngx_http_log_module）

以指定格式写入请求日志。

- access_log

```nginx
Syntax: access_log path [format [buffer=size] [gzip[=level]] [flush=time] [if=condition]];
	access_log off;
Default: access_log logs/access.log combined;
Context: http, server, location, if in location, limit_except
```

设置日志写入的路径、格式和配置。例如:

```nginx
access_log /path/to/log.gz combined gzip flush=5m;
# 如果希望gzip正常工作, nginx必须构建zlib库
```

- log_format

```nginx
Syntax: log_format name [escape=default | json | none] string ...;
Default: log_format combined "...";
Context: http
```

指定日志的格式。日志格式可以包含公共变量和仅在日志写入时存在的变量。

配置：

```nginx
log_format compression '$remote_addr - $remote_user [$time_local]'
					 '"$request" $status $bytes_sent'
   					 '"$http_referer" "$http_user_agent" 							 "$gzip_ratio"';
access_log /spool/logs/nginx-access.log compression buffer=32k;

#json格式日志:
log_format json '{"@timestamp":"$time_iso8601",'
			   '"client_ip":"$remote_addr",'
			   "size":$body_bytes_sent,'
			   '"responsetime":$request_time,
			   '"upstreamtime": "$upstream_response_time",'
			   "upstreamhost": "$upstream_addr",'
			   '"http_host":"$host",'
			   '"method": "$request_method",'
			   '"request_uri": "$request_uri",'
			   '"xff": "$http_x_forwarded_for",'
			   '"referrer": "$http_referer",'
			   '"agent": "$http_user_agent",'
			   '"status":"$status"}';
```



- open_log_file_cache

```nginx
Syntax: open_log_file_cache max=N [inactive=time] [min_uses=N] [valid=time]; 
open_log_file_cache off;
Default: open_log_file_cache off;
Context: http, server, location
```

定义一个缓存，用于存储名称中包含变量的常用日志的文件描述符。缓存常用日志文件相关的元数据信息。(对于每一条日志记录，都将是先打开文件，再写入日志，然后关闭。)

```nginx
open_log_file_cache max=1000 inactive=20s valid=1m min_uses=2;
# max:缓存的最大文件描述符数量
# min_uses:在inactive定义的时间内，允许描述符在缓存中保持打开状态的最小文件使用数
# inactive:如果在此期间没有访问，则关闭缓存描述符的时间:
# valid:此时间超时后，会检查文件还是否具有相同的名字。验正缓存中各缓存项是否为活动项的时间间隔。
```

## 2、压缩相关配置（ngx_http_gzip_module）

是一个使用"gzip"方法压缩响应的过滤器。这通常有助于将传输数据的大小减少一半甚至更多。

- gzip

```nginx
Syntax: gzip on | off;
Default: gzip off;
Context: http, server, location, if in location
```

为响应开启或者取消gzip压缩

- gzip_comp_level

```nginx
Syntax: gzip_comp_level level;
Default: gzip_comp_level 1;
Context: http, server, location
```

设置响应压缩的gzip级别，范围1-9

- gzip_buffers

```nginx
Syntax: gzip_buffers number size;
Default: gzip_buffers 32 4k | 16 8k;
Context: http,server, location
```

设置实现压缩功能时缓冲区数量及每个缓存区的大小。size默认大小等同于一个内存页, 4K或8K，取决于平台。

- gzip_disable

```nginx
Syntax: gzip_disable regex ...;
Default: -
Context: http, server, location
```

取消对匹配到的客户端浏览器的响应报文的gzip压缩。

- gzip_http_version

```nginx
syntax: gzip_http_version 1.0 | 1.1;
Default: gzip_http_version 1.1;
Context: http, server, location
```

设置压缩响应时，所需的请求的最小HTTP版本。

- gzip_min_length

```nginx
Syntax: gzip_min_length length;
Default: gzip_min_length 20;
Context: http, server, location
```

设置将被gzip处理的响应的最小长度。长度仅从"Content-Length"响应头字段确定。

- gzip_types

```nginx
Syntax: gzip_types mime-type ...;
Default: gzip_types text/html;
Context: http, server, location
```

除了"text/html"之外，还允许对指定的mime类型进行gzip处理。 特殊值"*"匹配任何MIME类型(0.8.29) 带有”text/html"类型的响应总是被压缩。

- gzip_vary

```nginx
Syntax: gzip_vary on | off;
Default: gzip_vary off;
Context: http, server, location
```

如果gzip,gzip_ static或gunzip是活跃的，开启或关闭在响应头插入"Vary:Accept-Encoding"区域。(给代理服务器用的，有的浏览器支持压缩，有的不支持，所以避免浪费不支持的也压缩，所以根据客户端的HTTP头来判断，是否需要压缩)

- gzip_proxied

```nginx
Syntax: gzip_proxied off | expired | no-cache | no-store | private | no_last_modified | no_etag | auth | any ...;
Default: gzip_proxied off; 
Context: http, server , location
```

依赖于请求和响应，开启对代理请求的gzip压缩。请求是被代理请求的确定是看请求头中是否出现"Via"区域。

- 内嵌变量$gzip_ratio

实现压缩比，计算为原始响应大小和压缩响应大小之间的比率，可以用于日志。

- 配置

```nginx
gzip		on; 
gzip_min_length 1000;
gzip_proxied	expired no-cache no-store private auth;
gzip_types		text/plain application/xml;
----------------------------------

gzip on:

gzip_comp_level 6;
gzip_http_version 1.1;
gzip_vary on;
gzip_min_length 1024;
gzip_buffers 16 8k;
gzip_proxied any;
gzip_disable "MSIE[1-6]\.(?!.*SVl)";
gzip_types text/xml text/plain text/css application/javascript application/xml
application/json;
```

## 3、HTTP模块（ngx_http_ssl_module）

此模块提供对HTTPS的必要支持。模块默认没有安装，需要通过--with-http_ssl_ module配置参数激活。这个模块需要OpenSSL库支持。

- ssl

```nginx
Syntax: ssl on | off;
Default: ssl off;
Context: http, server
```

该指令在1.15.0版中被废弃。应改为使用listen指令的ssl参数

- ssl_certificate  ( [sərˈtɪfɪkət , sərˈtɪfɪkeɪt] )

```nginx
Syntax: ssl_certificate file;
Default: -
Context: http, server
```

为给定的虚拟服务器指定具有PEM格式证书的文件。如果除了主证书之外还应指定中间证书,则应按以下顺序在同一文件中指定证书；首先是主证书,然后是中间证书。PEM格式的密钥可以放在同一个文件中。
从版本1.11.0开始，可以多次指定此指令以加载不同类型的证书,例如RSA和ECDSA：

```nginx
server {
	listen				443 ssl;
	server_name			example.com;
    
	ssl_certificate		example.com.rsa.crt;
	ssl_certificate_key	example.com.rsa.key;
    
	ssl_certificate		example.com.ecdsa.crt;
	ssl_certificate_key example.com.ecdsa.key;
    
    ...
}
```

只有OpenSSL 1.0.2或更高版本支持不同证书的单独证书链。对于旧版本，只能使用一个证书链。应该记住，由于HTTPS协议对最大互操作性的限制，虚拟服务器应该侦听不同的IP地址。

- sll_certificate_key

```nginx
Syntax: ssl_certificate_key file;
Default: -
Context: http, server
```

明确为虚拟服务器指定一个含有加密key的PEM格式文件。即证书的私钥文件。

- ssl_protocols

```nginx
Syntax: ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];
Default: ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
Context: http, server
```

启用指定的协议。

仅当使用OpenSSL 1.0.1或更高版本时，TLSv1.1和TLSv1.2参数(1.1.13， 1.0.12) 才起作用。只有在使用了用TLSv1.3支持构建的OpenSSL 1.1.1时, TLSv1.3参数(1.13.0) 才有效。

```shell
# 查看openssl版本
$ rpm -qa | grep openssl
$ rpm -qi openssl
```

- ssl_session_cache

```nginx
Syntax: ssl_session_cache off | none | [builtin[:size]] [shared:name:size];
Default: ssl_session_cache none;
Context: http, server
```

设置存储会话的缓存的类型和大小。缓存可以是以下任何类型:

- off：严格禁止使用会话缓存：nginx显式地告诉客户机会话不能被重用。
- none：会话缓存的使用被悄悄地禁止：nginx告诉客户机会话可以重用，但实际上不会将会话参数存储在缓存中。
- builtin: 内置OpenSSL缓存；仅被一个工作进程使用。缓存大小是在会话中指定的。如果没有给出大小，则等于20480个会话。使用内置缓存可能会导致内存碎片。
- shared: 在所有工作进程之间共享的缓存。缓存大小以字节为单位； 1M字节可以存储大约4000个会话。每个共享缓存都应该有一个任意名称。具有相同名称的缓存可以在多个虚拟服务器中使用。

两种缓存类型都可以同时使用，但是，只使用没有builtin缓存的shared缓存应该更高效。例如:

```nginx
ssl_session_cache builtin:1000 shared:SSL:10m;
```

- ssl_session_timeout

```nginx
Syntax: ssl_session_timeout time;
Default: ssl_session_timeout 5m;
Context: http, server
```

客户端可以重用会话参数的期限。

- 配置案例

```nginx

为了减少处理器负载，建议:
1.将工作进程数设置为处理器数，
2.启用keep-alive连接，
3.启用共享session缓存，
4.禁用内置session缓存，
5.并可能延长会话生存时间(默认为5分钟)
"""

worker_processes auto;

http {
	...
	server {
	listen			443 ssl;
	keepalive_timeout		70;
        
	ssl_protocols		TLSv1 TLSv1.1 TLSv1.2;
	ssl_ciphers			AES128-SHA:AES256-SHA:RC4-SHA:DES-CBC3-SHA:RC4-MD5;
	ssl_certificate		/usr/1ocal/nginx/conf/cert.pem;
	ssl_certificate_key /usr/1ocal/nginx/conf/cert.key;
	ssl_session_cache	shared:SSL:10m;
	ssl_session_timeout 10m;
	
    ...
}
```

## 4、反向代理模块(ngx_http_ proxy_ module)

此模块允许将请求传递到其它的服务器。

- proxy_pass

```nginx
Syntax: proxy_pass URL;
Default: -
Context: location,	if in location, limit_except
```

设置一个被代理服务器的协议和地址以及选项URI，将其映射到一个location。协议可以指定"http"或"https"。地址可以指定为域名或IP地址，以及可选端口:

```nginx
proxy_pass http://localhost:8000/uri/;
```

指定UNIX socket路径时,路径应放到关键字:unix后面，并用冒号括起来。

```nginx
proxy_pass unix:/tmp/backend.socket:/uri/;
```

如果域名解析为多个地址，则所有地址将以轮询(round-robin) 方式使用。此外,可以将地址指定为服务器组。

参数值不能包含变量。在这种情况下，如果将地址指定为域名，则会在所描述的服务器组中搜索该名称,如果找不到，则使用解析程序确定该名称。

请求URl按如下方式传递到服务器:

- 如果proxy_ pass指定了URI，那么标准请求URI中匹配了location的部分要被指令中指定的URl替代。

```nginx
location /name/ {
	proxy_pass http://127.0.0.1/remote/;
}
```

- 如果proxy_pass没有指定URI，当原始请求被处理时，请求URI将以客户端发送的相同形式传递给服务器;或者当处理改变的URI时，传递完全规范化的URI。(1.1.12之前，只传递原始的URI)

```nginx
location /some/path/ {
	proxy_pass http://127.0.0.1;
}
```

在某些情况下，无法确定要替换的请求URI部分:

当使用正则表达式指定location时，并也在命名location内，proxy_pass应该做没有URI的指定。
当location中使用rewrite指令更改URI时，将使用相同的配置来处理请求(break)：

```nginx
location /name/ {
	rewrite /name/([^/]+) /users?name=$l break;
	proxy_pass http://127.0.0.1;
}
# 在这种情况下，将忽略指令中指定的URI,并将完全更改的请求URI传递给服务器。
```

- 当proxy_pass中使用了变量时如果在指令中指定了URI,则其会传递给服务器，原始请求URI被其替换。

```nginx
location /name/ {
	proxy_pass http://127.0.0.1$request_uri;
}
```

## 5、php相关模块(ngx_ http_ fastcgi module)

这个模块允许传递一个请求给FastCGI Server。

### 基本相关知识

#### 1.什么是FastCGl

FastCGl是一个可伸缩地、高速地在HTTP server和动态脚本语言间通信的接口。多数流行的HTTP server都支持FastCGI,包括Apache、 Nginx和lighttpd等。 同时, FastCGI也被许多脚本语言支持，其中就有PHP。

FastCGI接口方式采用C/S结构，可以将HTTP服务器和脚本解析服务器分开,同时在脚本解析服务器上启动一个或者多个脚本解析守护进程。当HTTP服务器每次遇到动态程序时， 可以将其直接交付给FastCGl进程来执行，然后将得到的结果返回给浏览器。这种方式可以让HTTP服务器专一地处理静态请求或者将动态脚本服务器的结果返回给客户端，这在很大程度上提高了整个应用系统的性能。

#### 2.Nginx+FastCGl运行原理

Nginx不支持对外部程序的直接调用或者解析，所有的外部程序(包括PHP)必须通过FastCG接口来调用。FastCGI接口在Linux 下是socket (这个socket可以是文件socket, 也可以是ip socket)。为了调用CGl程序,还需要一个FastCGl的 wrapper (wrapper可以理解为用于启动另一个程序的程序) ，这个wrapper绑定在某个固定socket上,如端口或者文件socket。当Nginx将CGI请求发送给这个socket的时候，通过FastCGI接口, wrapper接收到请求，然后派生出一个新的线程,这个线程调用解释器或者外部程序处理脚本并读取返回数据;接着，wrapper再将返回的数据通过FastCGl接口，沿着固定的socket传递给Nginx;最后, Nginx将返回的数据发送给客户端。这就是Nginx+FastCGl的整个运作过程。

![11](https://pic-onemue-cn.oss-cn-beijing.aliyuncs.com/docs/onemue1647249892Fq4h9c.png)

#### 3. spawn-fcgi与PHP-FPM

FastCGI接口方式在脚本解析服务器上启动一个或者多个守护进程对动态脚本进行解析，这些进程就是FastCGI进程管理器，或者称为FastCGI引擎。 spawn-fcgj与PHP-FPM就是支持PHP的两个FastCGl进程管理器。

spawn-fcgi是HTTP服务器lighttpd的一部分，目前已经独立成为一个项目,一般与lighttpd配合使用来支持PHP。但是lighttpd的spwan-fcgi在高并发访问的时候，会出现内存泄漏甚至自动重启FastCG的问题。Nginx是个轻量级的HTTP server,必须借助第三方的FastCG处理器才可以对PHP进行解析,因此Nginx+spawn-fcgi的组合也可以实现对PHP的解析。

PHP-FPM也是一个第三方的FastCGI进程管理器，它是作为PHP的一个补丁来开发的，在安装的时候也
需要和PHP源码一起编译，也就是说PHP-FPM被编译到PHP内核中，因此在处理性能方面更加优秀。同
时PHP-FPM在处理高并发方面也比spawn-fcgi引擎好很多，因此,推荐使用Nginx+PHP/PHP-FPM这个
组合对PHP进行解析。

FastCGl的主要优点是把动态语言和HTTP Server分离开来，所以Nginx与PHP/PHP-FPM经常被部署在
不同的服务器上，以分担前端Nginx服务器的压力,使Nginx专一处理静态请求和转发动态请求, 而PHP/PHP- FPM服务器专一解析PHP动态请求。

- fastcgi_pass

```nginx
Syntax: fastcgi_pass address;
Default: -
Context: location, if in location
```

设置FastCGI server的地址，地址可以是IP或者域名加上端口号。

```nginx
fastcgi_pass localhost: 9000;

#也可以是UNIX socket路径
fastcgi_pass unix:/tmp/fastcgi.socket;
```

如果域名解析为多个地址，则所有地址都将以循环方式使用。此外,可以将地址指定为服务器组。参数值不能包含变量。

- fastcgi_index

```nginx
Syntax: fastcgi_index name;
Default: -
Context: http, server, location
```

设置fastcgi默认的主页资源文件名

- fastcgi_param

```nginx
Syntax: fastcgi_param parameter value [if_not_empty] ;
Default: -
Context: http, server, location
```

设置应传递给FastCGI服务器的参数。该值可以包含文本、变量及其组合。如果当前级别没有定义,会从上一级继承。

对于PHP来说的最小化配置:

```nginx
fastcgi_param SCRIPT_FILENAME /home/www/scripts/php$fastcgi_script_name;
fastcgi_param QUERY_STRING		$query_string;
```

SCRIPT_ FILENAME参数用于PHP确定请求脚本的名字
QUERY_ STRING参数用于传递请求的参数

对于处理POST请求的脚本，还需要以下三个参数:

```nginx
fastcgi_param REQUEST METHOD 	$request_method; ;
fastcgi_param CONTENT_TYPE	$content_type;
fastcgi_param CONTENT_LENGTH	$content_length;
```

如果PHP编译时使用了--enable-force-cgi-redirect配置参数，则REDIRECT, _STATUS参数应该使用200值被传递

```nginx
fastcgi_param REDIRECT_STATUS 200; 
```

- fastcgi_cache_path

```nginx
Syntax: fastcgi_cache_path path [levels=levels] [use_temp_path=on|off] 
keys_zone=name:size [inactive=time]
		[max_size=size] [manager_files=number] [manager_sleep=time]
[manager_threshold=time] [loader_fi1es=number]
		[1oader_sleep=time] [loader_threshold=time] [purger=on|off]
[purger_files=number] [purger_sleep=time]
		[purger_thresho1d=time] ;
Default: -
Context: http
```

设置缓存的路径和其他参数。缓存数据存储在文件中。levels的目录层级为1到3级,每级的取值为1或者2；levels=1:2表示定义的2层目录结构，levels=1:2:2表示定义的3层目录结构。

```nginx
fastcgi_cache_path /data/nginx/cache levels=1:2 keys_zone=one:10m;
```

缓存的文件名看起来如下:

```nginx
/data/nginx/cache/c/29/b7f54b2df7773722d382f4809d65029c
```

一个缓存响应首先写入到临时文件，然后再重命名此文件，临时文件目录是否使用由use_temp_path参数定义的，如果这个参数省略或者设置为on，则临时文件目录为fastcgi_temp_path参数指定的位置，如果设置为off，则临时文件将直接放在缓存目录中。此外，所有活动key和有关数据的信息都存储在共享内存区域中，其名称和大小由keys_zone参数配置。1M字节的区域可以存储大约8000个key。

inactive参数指定时间内没有被访问的缓存数据将被清除，其默认值为10分钟；

max_size参数设置最大缓存大小，如果超出，缓存管理器将删除最近最少被使用的数据

- fastcgi_cache

```nginx
Syntax: fastcgi_cache zone | off;
Default: fastcgi_cache off;
Context: http, server, location
```

定义用于缓存的一个共享内存区域，同一个区域可以被用于多个位置；off取消缓存继承

- fastcgi_cache_key

```nginx
Syntax: fastcgi_cache_key string;
Default: -
Context: http, server, location
```

定义一个缓存的key，例如:

```nginx
fastcgi_cache_key localhost:9000$request_uri;
```

- fastcgi_cache_methods

```nginx
Syntax: fastcgi_cache_methods GETI HEAD | POST ...;
Default: fastcgi_cache_methods GET HEAD;
Context: http, server, location
```

定义缓存的客户端的请求方法，"GET"和"HEAD"方法总是被缓存，建议显式列出。

- fastcgi_cache_min_uses

```nginx
Syntax: fastcgi_cache_min_uses number;
Default: fastcgi_cache_min_uses 1;
Context: http, server, location
```

定义响应被缓存后的最小访问次数

- fastcgi_keep_conn

```nginx
Syntax: fastcgi_keep_conn on | off;
Default: fastcgi_keep_conn off;
Context: http, server, location
```

默认情况下，fastcgj服务器将在发送响应后立即关闭连接。当该指令设置为on时，nginx将指示fastcgi服务器保持连接打开建议开启。

- fastcgi_cache_valid

```nginx
Syntax: fastcgi_cache_valid [code ...] time;
Default: -
Context: http, server, location
```

设置不同的响应码的缓存时间。例如:

```nginx
fastcgi_cache_valid 200 302 10m;
fastcgi_cache_valid 404	1m;
```

响应码为200和302的缓存时间为10分钟；404 响应码缓存时间为1分钟

```nginx
fastcgi_cache_valid 5m;
```

如果仅设置时间，则只有200, 301, 302响应码被缓存

```nginx
fastcgi_cache_valid 200 302 10m;
fastcgi_cache_valid 301 1h;
fastcgi_cache_valid any 1m;
```

还可以指定any参数来缓存任何响应

缓存参数也可以直接在响应头中设置。这比使用指令设置缓存时间具有更高的优先级。例如:如果头包含"Set-Cookie"字段，则不会缓存此类响应。

#### 4. 设置FastCGl

```nginx
location / {
	fastcgi_pass localhost :9000;
	fastcgi_index index.php;
    
	fastcgi_param SCRIPT_FILENAME /home/www/scripts/phpsfastcgi_script_name;
	fastcgi_param QUERY_STRING	$query_string;
	fastcgi_param REQUEST METHOD $request_method;
	fastcgi_param CONTENT TYPE	$content_type;
	fastcgi_param CONTENT_LENGTH $content_length;
}
```

#### 5. 设置缓存的例子

```nginx
http {
fastcgi_cache_path /var/cache/nginx/fcgi_cache
levels=1:2:1 keys_zone=fcgicache:20m inactive=120s ;
...
server {
    location ~* \. php$ {
        ...
        fastcgi_cache fcgicache;
        fastcgi_cache_key $request_uri ;
        fastcgi_cache_valid 200 302 10m;
        fastcgi_cache_valid 301 lh;
        fastcgi_cache_valid any lm;
...
}

}
```

